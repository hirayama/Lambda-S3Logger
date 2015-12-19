# Lambda-S3Logger
Send S3 log files to Redshift by Lambda. (AWS)

# Usage
The Lambda script is called when a object is put on the S3 bucket.  
The script catch the object path (=Bucket name and Key) and send the object to Redshift by "Copy" command.

# Steps

 * Enable logging on the target bucket on S3, using aws console.
 * Create Redshift table.
 * Create Lambda function.
   * Set the trigger "PUT method on the log bucket"
   * Set the permission "RedshiftFullAccess"
   * Timeout in 60 or 120 sec
 * You need a EC2 instance, attached Elastic IP for tunneling.
 * Edit *src/index.js* in your own context.
 * Run the *package.sh*, and upload the zip file.
 * Enable the trigger.

# Note

The IP address of the processing Lambda instance is not static.  
You need to set 0.0.0.0/0 permission to Redshift cluster or use the NAT instance for IP forwarding.
