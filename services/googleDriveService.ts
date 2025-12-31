
// Types for Google API
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export const googleDriveService = {
  tokenClient: null as any,
  accessToken: null as string | null,
  isInitialized: false,

  /**
   * Initializes the GAPI client and Identity Services
   */
  init: async (apiKey: string, clientId: string) => {
    if (!window.gapi || !window.google) {
      throw new Error("Google scripts not loaded");
    }

    return new Promise<void>((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: apiKey,
            discoveryDocs: DISCOVERY_DOCS,
          });

          googleDriveService.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                googleDriveService.accessToken = tokenResponse.access_token;
              }
            },
          });

          googleDriveService.isInitialized = true;
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  },

  /**
   * Triggers the Google Login Popup
   */
  signIn: async (): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!googleDriveService.tokenClient) return reject("Client not initialized");

        // Override callback for this specific request to capture completion
        googleDriveService.tokenClient.callback = (resp: any) => {
            if (resp.error) {
                reject(resp);
            }
            googleDriveService.accessToken = resp.access_token;
            resolve(resp.access_token);
        };

        // Request token
        googleDriveService.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  },

  /**
   * Gets user info using the access token
   */
  getUserInfo: async () => {
      if (!googleDriveService.accessToken) throw new Error("No access token");
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${googleDriveService.accessToken}` }
      });
      return await response.json();
  },

  /**
   * Finds or Creates the 'Dulce Alya Backup' folder
   */
  ensureFolderExists: async (): Promise<string> => {
    const folderName = "Dulce Alya Backup";
    const q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    
    const response = await window.gapi.client.drive.files.list({
      q: q,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    const files = response.result.files;
    if (files && files.length > 0) {
      return files[0].id;
    } else {
      // Create folder
      const createResponse = await window.gapi.client.drive.files.create({
        resource: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      return createResponse.result.id;
    }
  },

  /**
   * Uploads or Updates the JSON database file inside the folder
   */
  saveFile: async (data: any, fileName: string = "DulceAlya_DB.json"): Promise<void> => {
    if (!googleDriveService.accessToken) throw new Error("No Logged In");
    
    const folderId = await googleDriveService.ensureFolderExists();

    // Check if file exists
    const q = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
    const listRes = await window.gapi.client.drive.files.list({ q, fields: 'files(id)' });
    
    const fileContent = JSON.stringify(data, null, 2);
    const file = new Blob([fileContent], { type: 'application/json' });
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      parents: [folderId] // Only used on create
    };

    const accessToken = googleDriveService.accessToken;
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    if (listRes.result.files && listRes.result.files.length > 0) {
      // UPDATE existing file
      const fileId = listRes.result.files[0].id;
      // Note: Updating via REST requires a different endpoint structure for multipart
      // Simplifying to use standard fetch for update
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form
      });
    } else {
      // CREATE new file
      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form
      });
    }
  },

  /**
   * Downloads the file content
   */
  loadFile: async (fileName: string = "DulceAlya_DB.json"): Promise<any | null> => {
    // Find folder first
    const folderId = await googleDriveService.ensureFolderExists();
    const q = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
    const listRes = await window.gapi.client.drive.files.list({ q, fields: 'files(id)' });

    if (listRes.result.files && listRes.result.files.length > 0) {
        const fileId = listRes.result.files[0].id;
        const response = await window.gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        return response.result; // Returns the parsed JSON body directly if gapi handles it, or string
    }
    return null;
  }
};
