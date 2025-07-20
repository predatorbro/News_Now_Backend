import mongoose from "mongoose";
const SettingSchema = new mongoose.Schema({
    websiteName: {
        type: String,
    },
    image: {
        type: String,
    },
    themeColor: {
        type: String,
    },
    footerDescription: {
        type: String,
    }
});

export const Setting = mongoose.model("Setting", SettingSchema);
