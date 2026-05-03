
print("1. Python script is starting...")
import grpc
import time
import os
import sys
from concurrent import futures
from sentence_transformers import SentenceTransformer
import requests
from dotenv import load_dotenv
load_dotenv()

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../"))
if project_root not in sys.path:
    sys.path.append(project_root)

try:
    import internal.llm_proto.llm_inference_pb2 as pb2
    import internal.llm_proto.llm_inference_pb2_grpc as pb2_grpc
except ImportError as e:
    print(f" Import Error: {e}")
    sys.exit(1)

embed_model = SentenceTransformer('all-MiniLM-L6-v2')



class LLMInferenceServicer(pb2_grpc.LLMInferenceServicer):
    def GenerateResponse(self, request, context):
        print(f"Python calling gemini for: {request.prompt}")

        try:
             API_KEY = os.getenv("GEMINI_API_KEY")
             if not API_KEY:
                print("⚠️ WARNING: GEMINI_API_KEY is not set!")

             url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key={API_KEY}"
             payload = {
                 "contents": [
                     {
                         "parts": [
                             {"text": request.prompt}
                         ]
                     }
                 ]
             }

             response = requests.post(url, json=payload)
             data = response.json()

             if "candidates" not in data or not data["candidates"]:
                 error_msg = data.get("error", {}).get("message", "Unknown AI Error")

                 yield pb2.TokenResponse(token=f"AI Error: {error_msg}")
                 return

             text = data["candidates"][0]["content"]["parts"][0]["text"]

             words = text.split(' ')
             for word in words:
              yield pb2.TokenResponse(token=word + " ")
              time.sleep(0.01)
        except Exception as e:
            print(f"LLM Error: {e}")
            yield pb2.TokenResponse(token=f"\n[AI Error: {str(e)}]")

    def GetEmbedding(self, request, context):
        print(f"Python generating embedding for text: {request.text[:30]}...")
        vector = embed_model.encode(request.text).tolist()
        return pb2.EmbeddingResponse(embedding=vector)
    
    def GetUnaryResponse(self, request, context):
        print(f"Python generating unary response...")
        try:
            API_KEY = os.getenv("GEMINI_API_KEY")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key={API_KEY}"
            
            payload = {
                "contents": [{"parts": [{"text": request.prompt}]}]
            }
            response = requests.post(url, json = payload, timeout=30)
            data = response.json()

            if "candidates" not in data or not data["candidates"]:
                print(f"❌ Gemini API Error: {data}")
                return pb2.TokenResponse(token="[AI could not generate summary]")


            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return pb2.TokenResponse(token=text)
        
        except Exception as e:
            print(f"❌ Unary Error: {type(e).__name__} - {e}")
        return pb2.TokenResponse(token="Error generating summary")

def serve():
    print("3. serve() function is called...") 
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    pb2_grpc.add_LLMInferenceServicer_to_server(LLMInferenceServicer(), server)
    server.add_insecure_port('[::]:50051')
    print("Python gRPC server starting on port 50051...")
    server.start()
    server.wait_for_termination()    
    print("2. About to check __name__...") 

if __name__ == '__main__':
    serve()    