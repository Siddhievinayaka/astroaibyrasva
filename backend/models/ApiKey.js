import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  label: {
    type: String,
    required: false,
    trim: true,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ApiKey = mongoose.model("ApiKey", apiKeySchema);
export default ApiKey;
