// Verified against the live Notes API response bodies — kept centralized so
// a wording change on the API only needs updating in one place.
export const apiErrors = {
  titleLength: 'Title must be between 4 and 100 characters',
  descriptionLength: 'Description must be between 4 and 1000 characters',
  invalidCategory: 'Category must be one of the categories: Home, Work, Personal',
  noteNotFound: 'No note was found with the provided ID, Maybe it was deleted',
  emailAlreadyRegistered: 'An account already exists with the same email address',
  incorrectLogin: 'Incorrect email address or password',
  missingAuthToken: 'No authentication token specified in x-auth-token header',
  invalidAuthToken: 'Access token is not valid or has expired, you will need to login',
};

// Page copy documents both possible randomized values; tests assert
// membership in this set rather than a single exact string since the
// message is randomized on every page load.
export const possibleNotificationMessages = ['Action successful', 'Action unsuccessful, please try again'];

// Verified from assets/js/js-dialogs.js on the live site.
export const uploadMessages = {
  heading: 'File Uploaded!',
  fileTooLarge: 'File too large, please select a file less than 500KB',
};

export const dialogMessages = {
  alertDialogText: 'I am a Js Alert',
  alertResponse: 'OK',
  confirmDialogText: 'I am a Js Confirm',
  confirmAcceptedResponse: 'Ok',
  confirmDismissedResponse: 'Cancel',
  promptDialogText: 'I am a Js prompt',
};
