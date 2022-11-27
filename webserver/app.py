from fastapi import FastAPI
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pymongo
import mongoenv

conn_str = mongoenv.mongo_connstr_gmailutils # TODO: sort up the env vars shenanigans
client = pymongo.MongoClient(conn_str, serverSelectionTimeoutMS=5000)
db = client["GmailUtils"]
mails_collection = db["mails"]
INVIS_IMG = bytearray(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x01sRGB\x00\xae\xce\x1c\xe9\x00\x00\x00\x04gAMA\x00\x00\xb1\x8f\x0b\xfca\x05\x00\x00\x00\tpHYs\x00\x00\x0e\xc3\x00\x00\x0e\xc3\x01\xc7o\xa8d\x00\x00\x00\x0cIDAT\x18Wc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xa75\x81\x84\x00\x00\x00\x00IEND\xaeB`\x82')

class NewMailPostData(BaseModel):
  mid: str


app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"]
)


@app.post("/newMail")
async def newMail(data: NewMailPostData):
  print(data)
  # mails_collection.insert_one({
  #   "mid": data.mid,
  #   "hasOpened": False,
  #   "openedTimestamp": 0,
  # })


@app.get("/read", responses={
  200: {
    "content": {"image/png": {}}
  }
})
async def readMail(mid: str):
  # TODO: ignore read open if request IP comes from sender
  print(f"opened mail {mid}")
  # TODO: return invis image as response
  return Response(content="".join(map(lambda x: str(x), list(INVIS_IMG))), media_type="image/png")
