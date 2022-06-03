const core = require('@actions/core');
const { ApiClient, ApiClientInMemoryContextProvider } = require('@northflank/js-client');

(async () => {
  // Get the inputs.
  const host = core.getInput('northflank-api-host');
  const token = core.getInput('northflank-api-key', { required: true });
  const projectId = core.getInput('project-id', { required: true });
  const serviceId = core.getInput('service-id');
  const jobId = core.getInput('job-id');

  const imagePath = core.getInput('image-path', { required: true });
  const credentials = core.getInput('credentials-id');

  if ((!serviceId && !jobId) || (serviceId && jobId)) {
    core.setFailed(`Either 'service-id' or 'job-id' must be defined.`);
  }

  try {
    // Setup the context.
    const contextProvider = new ApiClientInMemoryContextProvider();
    await contextProvider.addContext({ name: 'main-context', token, host });

    // Initialize the API client.
    const client = new ApiClient(contextProvider);

    // Deploy the Docker image.
    const nfObjectType = serviceId ? 'service' : 'job';

    const response = await client.update[nfObjectType].deployment({
      parameters: { projectId, serviceId, jobId },
      data: { external: { imagePath, ...(credentials && { credentials }) } },
    });

    // Check for an error and log it.
    if (response.error) {
      core.setFailed(`Failed to deploy image to Northflank:\n${JSON.stringify(response.error)}`);
    } else {
      core.info('Successfully deployed image to Northflank.');
    }
  } catch (err) {
    core.setFailed(`Failed to deploy image to Northflank:\n${err}`);
  }
})();