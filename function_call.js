// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const {
  BedrockRuntimeClient,
  ConverseCommand,
} = require("@aws-sdk/client-bedrock-runtime");
const logger = require("winston");

// Configure logger
logger.configure({
  level: "info",
  format: logger.format.simple(),
  transports: [new logger.transports.Console()],
});

class StationNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "StationNotFoundError";
  }
}

function getTopSong(callSign) {
  let song = "";
  let artist = "";

  if (callSign === "WZPZ") {
    song = "Elemental Hotel";
    artist = "8 Storey Hike";
  } else {
    throw new StationNotFoundError(`Station ${callSign} not found.`);
  }

  return { song, artist };
}

async function generateText(client, modelId, toolConfig, inputText) {
  logger.info(`Generating text with model ${modelId}`);

  // Create the initial message from the user input.
  const messages = [
    {
      role: "user",
      content: [{ text: inputText }],
    },
  ];

  let response = await client.send(
    new ConverseCommand({
      modelId: modelId,
      messages: messages,
      toolConfig: toolConfig,
    })
  );

  let outputMessage = response.output.message;
  messages.push(outputMessage);
  const stopReason = response.stopReason;

  if (stopReason === "tool_use") {
    // Tool use requested. Call the tool and send the result to the model.
    const toolRequests = response.output.message.content;
    for (const toolRequest of toolRequests) {
      if ("toolUse" in toolRequest) {
        const tool = toolRequest.toolUse;
        logger.info(`Requesting tool ${tool.name}. Request: ${tool.toolUseId}`);

        if (tool.name === "top_song") {
          let toolResult = {};
          try {
            const { song, artist } = getTopSong(tool.input.sign);
            toolResult = {
              toolUseId: tool.toolUseId,
              content: [{ json: { song: song, artist: artist } }],
            };
          } catch (err) {
            if (err instanceof StationNotFoundError) {
              toolResult = {
                toolUseId: tool.toolUseId,
                content: [{ text: err.message }],
                status: "error",
              };
            } else {
              throw err;
            }
          }

          const toolResultMessage = {
            role: "user",
            content: [{ toolResult: toolResult }],
          };
          messages.push(toolResultMessage);

          // Send the tool result to the model.
          response = await client.send(
            new ConverseCommand({
              modelId: modelId,
              messages: messages,
              toolConfig: toolConfig,
            })
          );
          outputMessage = response.output.message;
        }
      }
    }
  }

  // Print the final response from the model.
  for (const content of outputMessage.content) {
    console.log(JSON.stringify(content, null, 4));
  }
}

async function main() {
  logger.info("Starting tool use example");

  const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";
  const inputText = "What is the most popular song on WZPZ?";

  const toolConfig = {
    tools: [
      {
        toolSpec: {
          name: "top_song",
          description: "Get the most popular song played on a radio station.",
          inputSchema: {
            json: {
              type: "object",
              properties: {
                sign: {
                  type: "string",
                  description:
                    "The call sign for the radio station for which you want the most popular song. Example calls signs are WZPZ, and WKRP.",
                },
              },
              required: ["sign"],
            },
          },
        },
      },
    ],
  };

  const client = new BedrockRuntimeClient({ region: "eu-west-2" });

  try {
    console.log(`Question: ${inputText}`);
    await generateText(client, modelId, toolConfig, inputText);
  } catch (err) {
    const message = err.message;
    logger.error(`An error occurred: ${message}`);
    console.error(`An error occurred: ${message}`);
  } finally {
    logger.info(`Finished generating text with model ${modelId}.`);
  }
}

if (require.main === module) {
  main();
}
