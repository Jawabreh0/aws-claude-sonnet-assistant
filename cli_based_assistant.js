const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

async function askClaude(userMessage, client, modelId) {
  // Start a conversation with the user message.
  const conversation = [
    {
      role: "user",
      content: [{ type: "text", text: userMessage }],
    },
  ];

  try {
    // Prepare the request body
    const body = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      messages: conversation,
      temperature: 1,
      top_k: 250,
    });

    // Send the message to the model, using a basic inference configuration.
    const command = new InvokeModelCommand({
      modelId: modelId,
      body: body,
      contentType: "application/json",
      accept: "application/json",
    });

    const response = await client.send(command);

    // Parse the response body
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract and return the response text.
    const responseText = responseBody.content[0].text;
    return responseText;
  } catch (error) {
    return `ERROR: Can't invoke '${modelId}'. Reason: ${error}`;
  }
}

async function main() {
  // Create a Bedrock Runtime client in the AWS Region you want to use.
  const client = new BedrockRuntimeClient({ region: "eu-west-2" });
  const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";

  console.log("Welcome to CMND.ai Claude Sonnet 3.5 Assistant");

  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (query) =>
    new Promise((resolve) => readline.question(query, resolve));

  while (true) {
    const userMessage = await askQuestion("User: ");
    if (
      userMessage.toLowerCase() === "exit" ||
      userMessage.toLowerCase() === "quit"
    ) {
      console.log("Claude: Goodbye!");
      readline.close();
      break;
    }

    const response = await askClaude(userMessage, client, modelId);
    console.log(`Claude: ${response}`);
  }
}

main();
