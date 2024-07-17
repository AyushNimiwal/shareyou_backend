const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}


export { asyncHandler }


// const asyncHandler=()=>{}
// const asyncHandler=(func)=>()=>{}//higher order function
// const asyncHandler=(func)=>async ()=>{}//higher order function


//try catch
// const asyncHandler=(func)=>async (req,res,next)=>{
//     try{
//         await func(req,res,next);
//     }catch(e){
//         res.status(e.code||500).json({
//             success:false,
//             message:e.message
//         })
//     }
// }