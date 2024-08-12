window.addEventListener('DOMContentLoaded', async () => {
  const firstTimePopUP = document.getElementById('firstOpen');
  const historyGuideDialog = document.getElementById('historyGuideDialog');
  const historyGuide = document.getElementById('historyGuide');
  const closeButtons = document.querySelectorAll('.closePopUP');

  const generateBtn = document.getElementById('generateBtn');
  const generationConfirmDialog = document.getElementById('generationConfirmDialog');
  const confirmGenerateBtn = document.getElementById('confirmGenerate');

  const showNewFeatureDialog = document.getElementById('showNewFeatureDialog');
  const newFeatureDialog = document.getElementById('newFeatureDialog');

  const showGenerateDialog = document.getElementById('showGenerateDialog');
  const generateGuideDialog = document.getElementById('generateGuideDialog');

  const historyBtn = document.getElementById('HistoryBtn');
  const historyDialog = document.getElementById('historyDialog');
  const historyList = document.getElementById('historyList');

  const encryptBtn = document.getElementById('encryptBtn');
  const serviceSelectionDialog = document.getElementById('serviceSelectionDialog');
  const serviceInput = document.getElementById('serviceInput');
  const confirmServiceSelection = document.getElementById('confirmServiceSelection');
  const passwordInput = document.getElementById('password-input');
  const passwordStrengthFeedback = document.getElementById('password-strength-feedback');

  const serviceWarning = document.createElement('p');
  serviceWarning.style.color = 'red';
  serviceWarning.style.display = 'none';
  serviceWarning.textContent = 'Please enter a service name.';
  serviceSelectionDialog.querySelector('form').insertBefore(serviceWarning, serviceSelectionDialog.querySelector('menu'));

  // Check if it's the first time the app is opened
  try {
    const firstOpenValue = await window.electron.getFileData();
    if (firstOpenValue.trim() === 'True') {
      firstTimePopUP.showModal();
    }
  } catch (error) {
    console.error('Error reading file:', error);
  }

  // Add event listeners to close buttons to close dialog pop-ups
  closeButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      const dialog = event.target.closest('dialog');
      if (dialog) {
        dialog.close();
        setTimeout(() => passwordInput.focus(), 100); // Force focus with a slight delay
      }
      if (firstTimePopUP.open) {
        firstTimePopUP.close();
        window.electron.updateFileData('False').catch(console.error);
      }
    });
  });

  // Show history guide dialog
  historyGuide.addEventListener('click', () => {
    historyGuideDialog.showModal();
  });

  // Show confirmation dialog for password generation
  generateBtn.addEventListener('click', () => {
    const specialChars = document.getElementById('specialChars').value;
    const numbers = document.getElementById('numbers').value;
    const length = document.getElementById('length').value;

    const confirmationText = `You have selected ${specialChars} special character(s), ${numbers} number(s), and a password length of ${length} characters. Do you want to proceed with password generation?`;

    document.getElementById('confirmationText').innerText = confirmationText;
    generationConfirmDialog.showModal();
  });

  // Generate password and update the input field, then check password strength
  confirmGenerateBtn.addEventListener('click', async () => {
    const specialChars = document.getElementById('specialChars').value;
    const numbers = document.getElementById('numbers').value;
    const length = document.getElementById('length').value;

    try {
      const password = await window.electron.generatePassword(specialChars, numbers, length);
      document.getElementById('password-input').value = password;
      generationConfirmDialog.close();
      setTimeout(() => passwordInput.focus(), 100); // Force focus with a slight delay

      console.log('Generated password:', password);

      // Check the password strength and update the feedback
      await updatePasswordFeedback(password);
    } catch (error) {
      console.error('Error generating password or checking strength:', error);
      const feedbackElement = document.getElementById('password-strength-feedback');
      feedbackElement.textContent = 'Error occurred while checking password strength.';
      feedbackElement.style.display = 'block';
    }
  });

  // Show new feature dialog
  showNewFeatureDialog.addEventListener('click', () => {
    newFeatureDialog.showModal();
  });

  // Show generate guide dialog
  showGenerateDialog.addEventListener('click', () => {
    generateGuideDialog.showModal();
  });

  // Show password history
  historyBtn.addEventListener('click', async () => {
    try {
      const history = await window.electron.getPasswordHistory();

      historyList.innerHTML = '';

      history.forEach(password => {
        const listItem = document.createElement('li');
        listItem.textContent = password;
        historyList.appendChild(listItem);
      });

      historyDialog.showModal();
    } catch (error) {
      console.error('Error fetching password history:', error);
    }
  });

  // Add event listener to Encrypt button to show service selection dialog
  encryptBtn.addEventListener('click', () => {
    serviceInput.value = ''; // Clear the input field each time the dialog opens
    serviceWarning.style.display = 'none'; // Hide the warning if previously shown
    serviceSelectionDialog.showModal();
  });

  // Handle the confirmation of the service selection
  confirmServiceSelection.addEventListener('click', async () => {
    const serviceName = serviceInput.value;
    const password = passwordInput.value;

    if (serviceName) {
      serviceWarning.style.display = 'none'; // Hide the warning if service name is provided
      serviceSelectionDialog.close();

      try {
        // Encrypt the password using enchipher.py service
        const encryptedPassword = await window.electron.encryptPassword(password);
        console.log(`Encrypted password: ${encryptedPassword}`);

        // Store the encrypted password using storage_service.py
        const saveResult = await window.electron.savePassword({ service_name: serviceName, password: encryptedPassword });
        console.log('Save result:', saveResult);

        alert('Password encrypted and saved successfully.');
      } catch (error) {
        console.error('Error encrypting or saving the password:', error);
        alert('Failed to encrypt and save the password.');
      }
      
      setTimeout(() => passwordInput.focus(), 100); // Force focus with a slight delay
    } else {
      serviceWarning.style.display = 'block'; // Show the warning if service name is missing
      serviceInput.focus(); // Re-focus on the service input field
    }
  });

  // Add event listener for user typing in the password field
  passwordInput.addEventListener('input', async () => {
    const password = passwordInput.value;

    if (password.length > 0) {
      try {
        // Check the password strength and update the feedback
        await updatePasswordFeedback(password);
      } catch (error) {
        console.error('Error checking strength:', error);
        const feedbackElement = document.getElementById('password-strength-feedback');
        feedbackElement.textContent = 'Error occurred while checking password strength.';
        feedbackElement.style.display = 'block';
      }
    } else {
      // Hide feedback if the password field is empty
      passwordStrengthFeedback.style.display = 'none';
    }
  });

  // Function to update the password feedback with custom recommendations
  async function updatePasswordFeedback(password) {
    const feedback = await window.electron.checkPasswordStrength(password);
    console.log('Strength feedback:', feedback);

    const feedbackElement = document.getElementById('password-strength-feedback');

    let recommendations = feedback.suggestions;

    // Custom recommendations
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      recommendations.push('Add special characters.');
    }
    if (!/\d/.test(password)) {
      recommendations.push('Add numbers.');
    }

    if (feedback.strength === 4) { // Assuming the maximum score is 4
      feedbackElement.textContent = "Password Strength: Maximum - Your password is at maximum strength.";
    } else {
      feedbackElement.textContent = `Password Strength: ${feedback.strength} - ${recommendations.join(', ')}`;
    }

    feedbackElement.style.display = 'block';
  }
});
