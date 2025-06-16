const asyncHandler = (func) => {
    return (req, res, next) => {
      Promise.resolve(func(req, res, next)).catch((error) => next(error));
    };
  };
 module.exports= { asyncHandler };
  
  // const asyncHandler = () => {}
  // const asyncHandler = (fn) => ()=> {}
  // const asyncHandler = (fn) => async()=> {}
  
  /* one way to perform try catch to execute the async function
  const asyncHandler = (func) => async(req,res,next) => {
      try {
          await func(req,res,next)
      } catch (error) {
          res.status(error.code || 500).json({
              success : false,
              message : error.message
          })
      }
  }
  */
  