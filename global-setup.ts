import { generateUploadArtifacts } from './tests/ui/file-upload/artifacts';

// Runs once per `playwright test` invocation, before any worker starts.
// Add feature-level artifact generators here as new specs need them.
async function globalSetup() {
  generateUploadArtifacts();
}

export default globalSetup;
