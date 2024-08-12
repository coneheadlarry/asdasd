const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const { spawn } = require('child_process');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // check if the file exists
  const firstOpenPath = path.join(__dirname, 'firstOpen.txt');
  fs.access(firstOpenPath, fs.constants.F_OK, (err) => {
    if (err) {
      // file does not exist, create it
      fs.writeFile(firstOpenPath, 'True', (err) => {
        if (err) console.error('Error creating file:', err);
      });
    } else {
      // file exists, read it
      fs.readFile(firstOpenPath, 'utf8', (err, data) => {
        if (err) console.error('Error reading file:', err);
        if (data.trim() === 'True') {
          mainWindow.webContents.send('show-dialog', true);
        }
      });
    }
  });

  // create JSON file to track generation history
  const generationHistoryPath = path.join(__dirname, 'generationHistory.json');
  fs.access(generationHistoryPath, fs.constants.F_OK, (err) => {
    if (err) {
      // file does not exist, create it
      fs.writeFile(generationHistoryPath, '[]', (err) => {
        if (err) console.error('Error creating file:', err);
      });
    }
  });
}

// Start the password strength service
const strengthService = spawn('python', ['C:\\Users\\Khaled\\Documents\\361\\361app\\servises\\strength_service.py']);
strengthService.stdout.on('data', (data) => {
  console.log(`Strength Service stdout: ${data}`);
});
strengthService.stderr.on('data', (data) => {
  console.error(`Strength Service stderr: ${data}`);
});
strengthService.on('close', (code) => {
  console.log(`Strength Service exited with code ${code}`);
});

// Start the enchipher service
const enchipherService = spawn('python', ['C:\\Users\\Khaled\\Documents\\361\\361app\\servises\\enchipher.py']);
enchipherService.stdout.on('data', (data) => {
  console.log(`Enchipher Service stdout: ${data}`);
});
enchipherService.stderr.on('data', (data) => {
  console.error(`Enchipher Service stderr: ${data}`);
});
enchipherService.on('close', (code) => {
  console.log(`Enchipher Service exited with code ${code}`);
});

// Start the storage service
const storageService = spawn('python', ['C:\\Users\\Khaled\\Documents\\361\\361app\\servises\\storage_service.py']);
storageService.stdout.on('data', (data) => {
  console.log(`Storage Service stdout: ${data}`);
});
storageService.stderr.on('data', (data) => {
  console.error(`Storage Service stderr: ${data}`);
});
storageService.on('close', (code) => {
  console.log(`Storage Service exited with code ${code}`);
});

// IPC handler to check password strength
ipcMain.handle('check-password-strength', async (event, password) => {
  try {
    const response = await axios.post('http://localhost:5003/check_strength', { password });
    return {
      strength: response.data.score,
      suggestions: response.data.feedback.suggestions
    };
  } catch (error) {
    console.error('Error checking password strength:', error);
    return { strength: 'Unknown', suggestions: ['Error occurred while checking password strength.'] };
  }
});

// IPC handler to encrypt a password using the enchipher service
ipcMain.handle('encrypt-password', async (event, password) => {
  try {
    const response = await axios.post('http://localhost:5001/encrypt_message', {
      message: password,
      shift: 5 // Assuming shift value is 5 for the Caesar cipher
    });
    return response.data.encrypted_message;
  } catch (error) {
    console.error('Error encrypting password:', error);
    return 'Error encrypting password';
  }
});

// IPC handler to save the encrypted password using the storage service
ipcMain.handle('save-password', async (event, passwordData) => {
  try {
    const response = await axios.post('http://localhost:5002/save_password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Error saving password:', error);
    return 'Error saving password';
  }
});

// create the main window once the app is ready
app.whenReady().then(createWindow);

// command to quit the app and behavior for when it closes
app.on('window-all-closed', async () => {
  // set firstOpen.txt to 'False' before quitting
  const firstOpenPath = path.join(__dirname, 'firstOpen.txt');
  try {
    await fs.promises.writeFile(firstOpenPath, 'False');
  } catch (err) {
    console.error('Error updating firstOpen.txt:', err);
  }

  // delete generationHistory.json
  const generationHistoryPath = path.join(__dirname, 'generationHistory.json');
  fs.unlink(generationHistoryPath, (err) => {
    if (err) {
      console.error('Error deleting generationHistory.json:', err);
    } else {
      console.log('generationHistory.json deleted successfully.');
    }
  });

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// behavior for when the app is activated
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
// add the getFileData handler to read the firstOpen.txt file and return its contents
ipcMain.handle('get-file-data', async () => {
  const firstOpenPath = path.join(__dirname, 'firstOpen.txt');
  try {
    const data = await fs.promises.readFile(firstOpenPath, 'utf8');
    return data;
  } catch (err) {
    console.error('Error reading file:', err);
    return 'Error';
  }
});

// add the updateFileData handler to update the firstOpen.txt file with the given data 
ipcMain.handle('update-file-data', async (event, data) => {
  const firstOpenPath = path.join(__dirname, 'firstOpen.txt');
  try {
    await fs.promises.writeFile(firstOpenPath, data);
  } catch (err) {
    console.error('Error updating file:', err);
  }
});

// add the generatePassword handler
// this handler generates a password based on the given criteria and returns it
ipcMain.handle('generatePassword', async (event, specialChars, numbers, length) => {
  try {
    const password = generatePassword(specialChars, numbers, length);

    // append the generated password to the JSON file
    const generationHistoryPath = path.join(__dirname, 'generationHistory.json');
    const historyData = await fs.promises.readFile(generationHistoryPath, 'utf8');
    let history = JSON.parse(historyData);

    // add the new password at the front and trim the history if needed
    history.unshift(password);
    if (history.length > 5) {
      history = history.slice(0, 5);
    }

    await fs.promises.writeFile(generationHistoryPath, JSON.stringify(history, null, 2));

    return password;
  } catch (err) {
    console.error('Error generating password:', err);
    return 'Error';
  }
});

// add the getPasswordHistory handler
// this handler reads the generation history from the JSON file and returns it
ipcMain.handle('getPasswordHistory', async () => {
  const generationHistoryPath = path.join(__dirname, 'generationHistory.json');
  try {
    const historyData = await fs.promises.readFile(generationHistoryPath, 'utf8');
    const history = JSON.parse(historyData);
    return history;
  } catch (err) {
    console.error('Error reading password history:', err);
    return [];
  }
});

function generatePassword(specialChars, numbers, length) {
  const specialCharSet = '!@#$%^&*()_+[]{}|;:,.<>?';
  const numberSet = '0123456789';
  const letterSet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // validate input parameters
  specialChars = Math.min(4, Math.max(0, parseInt(specialChars, 10)));
  numbers = Math.min(4, Math.max(0, parseInt(numbers, 10)));
  length = Math.max(specialChars + numbers, parseInt(length, 10)); // Ensure length is at least specialChars + numbers

  // generate required number of each character type
  const passwordArray = [];
  for (let i = 0; i < specialChars; i++) {
    passwordArray.push(specialCharSet[Math.floor(Math.random() * specialCharSet.length)]);
  }
  for (let i = 0; i < numbers; i++) {
    passwordArray.push(numberSet[Math.floor(Math.random() * numberSet.length)]);
  }

  // fill the rest with random characters from the letterSet
  while (passwordArray.length < length) {
    passwordArray.push(letterSet[Math.floor(Math.random() * letterSet.length)]);
  }

  // shuffle the password array for some increased randomness
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}
