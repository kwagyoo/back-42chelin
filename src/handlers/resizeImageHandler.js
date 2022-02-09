// dependencies
const AWS = require("aws-sdk");
const sharp = require("sharp");

// get reference to S3 client
let s3 = new AWS.S3({ region: "ap-northeast-2" });

const transforms = [{ name: "w_500", width: 500 }];

exports.resizeImage = async (event, context, callback) => {
  console.log(event);

  const srcBucket = event.Records[0].s3.bucket.name;
  const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

  const key = event.Records[0].s3.object.key;
  const sanitizedKey = key.replace(/\+/g, " ");
  const parts = sanitizedKey.split("/");
  const foldername = parts[parts.length - 2];
  const filename = parts[parts.length - 1];

  const dstBucket = srcBucket;

  console.log(srcBucket, srcKey, key, sanitizedKey, parts, filename);

  // Infer the image type from the file suffix.
  const typeMatch = srcKey.match(/\.([^.]*)$/);
  if (!typeMatch) {
    console.log("Could not determine the image type.");
    return;
  }

  console.log("test", srcBucket);

  // Check that the image type is supported
  const imageType = typeMatch[1].toLowerCase();
  if (imageType != "jpg" && imageType != "png" && imageType != "jpeg") {
    console.log(`Unsupported image type: ${imageType}`);
    return;
  }

  // Download the image from the S3 source bucket.

  try {
    const params = {
      Bucket: srcBucket,
      Key: srcKey,
    };
    console.log(params);
    var origimage = await s3.getObject(params).promise();

    console.log("test2");
  } catch (error) {
    console.log(error);
    return;
  }
  // Upload the thumbnail image to the destination bucket
  try {
    const buffer = await sharp(origimage.Body).resize({ width: 500 }).withMetadata().toBuffer();

    const destparams = {
      Bucket: srcBucket,
      Key: `w_500/${foldername}/${filename}`, // w_500/iamgefile.jpg...
      Body: buffer,
      ContentType: "image",
    };
    console.log(destparams);

    return await s3.putObject(destparams).promise();

    console.log("test3");
  } catch (error) {
    console.log(error);
    return;
  }

  console.log("Successfully resized");
};
