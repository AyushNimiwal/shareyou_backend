import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary=async(localFilePath)=>{
    try{
        if(!localFilePath)return null;
        //upload the file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded successfull
        // console.log("File uploaded successfully",response.url);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
          }
        return response;
    }catch(error){
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
          }
        return null;
    }
}

const extractPublicId=(publicUrl)=>{
    const startIndex=publicUrl.lastIndexOf("/")+1;
    const endIndex=publicUrl.lastIndexOf(".");
    return publicUrl.substring(startIndex,endIndex);
}

const deleteFromCloudinary=async(publicUrl)=>{
    try{
        const publicId=extractPublicId(publicUrl);
        const response=await cloudinary.uploader.destroy(publicId);
        return response.result==="ok";
    }catch(error){
        return false;
    }

}

export {uploadOnCloudinary,deleteFromCloudinary}