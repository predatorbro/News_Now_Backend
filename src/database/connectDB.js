import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const instance = await mongoose.connect(process.env.MONGO_URI+"/NewsNow");
        console.log('Database connected :', instance.connection.name);
    } catch (error) {
        console.log(error);
    }
}

export default connectDB