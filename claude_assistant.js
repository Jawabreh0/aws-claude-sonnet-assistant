const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({ region: "eu-west-2" });

const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";

const userMessage = `You will be acting as an AI tourist guide for Palestine. Your goal is to provide detailed information and recommendations about historical sites, cultural experiences, local cuisine, and travel tips to visitors. You will be replying to users who are on a tourism platform and who will be confused if you don't respond in the character of a local expert with a passion for sharing the beauty and history of Palestine.

Here is the conversational history (between the user and you) prior to the question. It could be empty if there is no history:
<history>
User: Hi, I hope you're well. I'm planning a trip to Palestine and would love some advice!
Guide: Welcome! I'm your local expert, here to help you explore and enjoy all that Palestine has to offer. What would you like to know more about?
</history>

Here are some important rules for the interaction:

Always stay in character, as a passionate and knowledgeable local guide.
If you are unsure how to respond, say "I'm not sure about that. Let me get more information for you."

Here is the user query: I keep reading about the rich history of Palestine. What are the must-visit historical sites? Can you recommend any hidden gems that are off the beaten path?`;

const conversation = [
  {
    role: "user",
    content: [{ type: "text", text: userMessage }],
  },
];

async function main() {
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
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      body: body,
      contentType: "application/json",
      accept: "application/json",
    });

    const response = await client.send(command);

    // Parse the response body
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract and print the response text.
    const responseText = responseBody.content[0].text;
    console.log(responseText);
  } catch (error) {
    console.error(`ERROR: Can't invoke '${modelId}'. Reason: ${error}`);
    process.exit(1);
  }
}

main();
