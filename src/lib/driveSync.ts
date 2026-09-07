const DRIVE_APP_DATA_FOLDER = 'appDataFolder';

export interface CloudSavePayload {
  layouts: any[];
  chartSettings: any;
  activeIndicators: any[];
  drawings: any[];
  updatedAt: number;
}

export async function saveToGoogleDrive(accessToken: string, data: CloudSavePayload) {
  const fileName = 'otivo_chart_data.json';
  
  // Check if file already exists in appDataFolder
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${fileName}'&spaces=appDataFolder`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const searchData = await searchRes.json();
  const existingFile = searchData.files?.[0];

  const fileContent = JSON.stringify(data);
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: existingFile ? undefined : [DRIVE_APP_DATA_FOLDER],
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', new Blob([fileContent], { type: 'application/json' }));

  if (existingFile) {
    // Update existing file
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  } else {
    // Create new file in AppData folder
    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  }
}

export async function loadFromGoogleDrive(accessToken: string): Promise<CloudSavePayload | null> {
  const fileName = 'otivo_chart_data.json';
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${fileName}'&spaces=appDataFolder`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const searchData = await searchRes.json();
  const existingFile = searchData.files?.[0];

  if (!existingFile) return null;

  const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return await fileRes.json();
}
