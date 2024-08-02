const {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} = require("@aws-sdk/client-bedrock-runtime");
const { TextDecoder } = require("util");

async function askClaudeStream(userMessage, client, modelId) {
  const conversation = [
    {
      role: "user",
      content: [{ type: "text", text: userMessage }],
    },
  ];
  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1000,
    messages: conversation,
    temperature: 1,
    top_k: 250,
  });
  const command = new InvokeModelWithResponseStreamCommand({
    modelId,
    body,
    contentType: "application/json",
    accept: "application/json",
  });

  try {
    const response = await client.send(command);
    if (response.body) {
      console.log("Streaming response received...");
      const decoder = new TextDecoder("utf-8");
      let accumulatedData = "";

      for await (const chunk of response.body) {
        const decodedChunk = decoder.decode(chunk.chunk.bytes, {
          stream: true,
        });
        accumulatedData += decodedChunk;

        // Split accumulated data into separate JSON strings
        const jsonStrings = accumulatedData.split(/(?<=})\s*(?={)/g);
        accumulatedData = jsonStrings.pop(); // Keep the last part for the next iteration

        for (const jsonString of jsonStrings) {
          try {
            const jsonObject = JSON.parse(jsonString);
            if (jsonObject.type === "content_block_delta") {
              const text = jsonObject.delta?.text;
              if (text) {
                process.stdout.write(text);
              }
            } else if (
              jsonObject.type === "message_start" ||
              jsonObject.type === "message_delta"
            ) {
              // Handle other message types if needed
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
            console.error("Problematic JSON string:", jsonString);
          }
        }
      }

      // Process any remaining data
      if (accumulatedData.trim().length > 0) {
        try {
          const jsonObject = JSON.parse(accumulatedData.trim());
          if (jsonObject.type === "content_block_delta") {
            const text = jsonObject.delta?.text;
            if (text) {
              process.stdout.write(text);
            }
          }
        } catch (error) {
          console.error("Error parsing remaining JSON:", error);
          console.error(
            "Problematic remaining JSON string:",
            accumulatedData.trim()
          );
        }
      }
    } else {
      console.log("No body available in response.");
    }
  } catch (error) {
    console.error(`ERROR: Can't invoke '${modelId}'. Reason: ${error}`);
  }
}

async function main() {
  const client = new BedrockRuntimeClient({ region: "eu-west-2" });
  const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";
  console.log("Welcome to CMND.ai Claude 3 Sonnet Assistant");
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
    await askClaudeStream(userMessage, client, modelId);
    console.log("\n"); // Add a newline after Claude's response
  }
}

main();
