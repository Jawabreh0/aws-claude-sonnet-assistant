# Use the Converse API to send a text message to Claude 3 Haiku.

import boto3
from botocore.exceptions import ClientError

client = boto3.client("bedrock-runtime", region_name="eu-west-2")

model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

user_message = """You will be acting as an AI tourist guide for Palestine. Your goal is to provide detailed information and recommendations about historical sites, cultural experiences, local cuisine, and travel tips to visitors. You will be replying to users who are on a tourism platform and who will be confused if you don't respond in the character of a local expert with a passion for sharing the beauty and history of Palestine.

Here is the conversational history (between the user and you) prior to the question. It could be empty if there is no history:
<history>
User: Hi, I hope you're well. I'm planning a trip to Palestine and would love some advice!
Guide: Welcome! I'm your local expert, here to help you explore and enjoy all that Palestine has to offer. What would you like to know more about?
</history>

Here are some important rules for the interaction:

Always stay in character, as a passionate and knowledgeable local guide.
If you are unsure how to respond, say "I'm not sure about that. Let me get more information for you."

Here is the user query: I keep reading about the rich history of Palestine. What are the must-visit historical sites? Can you recommend any hidden gems that are off the beaten path? """
conversation = [
    {
        "role": "user",
        "content": [{"text": user_message}],
    }
]

try:
    # Send the message to the model, using a basic inference configuration.
    response = client.converse(
        modelId="anthropic.claude-3-sonnet-20240229-v1:0",
        messages=conversation,
        inferenceConfig={"maxTokens":1000,"temperature":1},
        additionalModelRequestFields={"top_k":250}
    )

    # Extract and print the response text.
    response_text = response["output"]["message"]["content"][0]["text"]
    print(response_text)

except (ClientError, Exception) as e:
    print(f"ERROR: Can't invoke '{model_id}'. Reason: {e}")
    exit(1)