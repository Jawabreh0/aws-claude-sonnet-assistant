import argparse
import boto3
from botocore.exceptions import ClientError

def ask_claude(user_message, client, model_id):
    # Start a conversation with the user message.
    conversation = [
        {
            "role": "user",
            "content": [{"text": user_message}],
        }
    ]

    try:
        # Send the message to the model, using a basic inference configuration.
        response = client.converse(
            modelId=model_id,
            messages=conversation,
            inferenceConfig={"maxTokens":1000, "temperature":1},
            additionalModelRequestFields={"top_k":250}
        )

        # Extract and return the response text.
        response_text = response["output"]["message"]["content"][0]["text"]
        return response_text

    except (ClientError, Exception) as e:
        return f"ERROR: Can't invoke '{model_id}'. Reason: {e}"

def main():
    # Create a Bedrock Runtime client in the AWS Region you want to use.
    client = boto3.client("bedrock-runtime", region_name="eu-west-2")
    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

    print("Welcome to CMND.ai Claude 3 Sonnet Assistant")
    while True:
        user_message = input("User: ")
        if user_message.lower() in ["exit", "quit"]:
            print("Claude: Goodbye!")
            break
        
        response = ask_claude(user_message, client, model_id)
        print(f"Claude: {response}")

if __name__ == "__main__":
    main()
