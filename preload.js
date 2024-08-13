const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getFileData: () => ipcRenderer.invoke('get-file-data'),
  updateFileData: (data) => ipcRenderer.invoke('update-file-data', data),
  generatePassword: (specialChars, numbers, length) => ipcRenderer.invoke('generatePassword', specialChars, numbers, length),
  getPasswordHistory: () => ipcRenderer.invoke('getPasswordHistory'),

  // Method to check password strength
  checkPasswordStrength: (password) => ipcRenderer.invoke('check-password-strength', password),

  // New methods for encrypting and saving passwords
  encryptPassword: (password) => ipcRenderer.invoke('encrypt-password', password),
  savePassword: (passwordData) => ipcRenderer.invoke('save-password', passwordData),

  getPasswords: () => ipcRenderer.invoke('get-passwords'),
  decryptPassword: (encryptedPassword) => ipcRenderer.invoke('decrypt-password', encryptedPassword),

  // Add the getPasswordReminders method here
  getPasswordReminders: () => ipcRenderer.invoke('get-password-reminders')
});
