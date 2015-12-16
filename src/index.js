/**
 * Lambda-S3Logger
 * 
 * Trigger: PUT method on the S3 log bucket
 * Execution: Copy the S3 log file to Redshift
 * 
 * @see		npm_installer.sh, package.sh
 * @since	2015-12-16
 * @author	Tomohiro Hirayama
 */

// requires
var pg = require('pg');
var async = require('async');
var aws = require('aws-sdk');
var exec = require('child_process').exec;

// variables
// for Redshift
var conString = 'pg://{username}:{password}@{hostname}:{port}/{dbName}';
var table_name = '{RedshiftTableName}';
var credentials = 'aws_access_key_id={aws_access_key};aws_secret_access_key={aws_secret_access_key}';
var options = "delimiter ' ' REMOVEQUOTES COMPUPDATE OFF MAXERROR 1000 TIMEFORMAT AS '[DD/MON/YYYY:HH24:MI:SS' REGION '{S3Region}'";
var redshift_region = 'us-east-1';
var securityGroup = 'default';

// global
var lambda_ip = '';
var redshift = null;

// main
exports.handler = function(event, context) {

	console.log('Catch S3 PUT Event');

	// Get S3 Object Meta Data
	var bucket = event.Records[0].s3.bucket.name;
	var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
	var params = {
		Bucket: bucket,
		Key: key
	};

	// async processes
	async.series([

		// Get Lambda IP
		function (callback) {
			var cmd = "curl http://checkip.amazonaws.com/";
			exec(cmd, function(error, stdout, stderr) {
				if (!error) {
					lambda_ip = stdout.replace(/\r?\n/g,"");
					console.log('Lambda IP: ' + stdout);
				} else {
					console.log("error code: ", error);
					context.done(err,'lambda');
				}
				callback(null, "Get Lambda IP: [" + lambda_ip + "]");
			});
		},

		// Set the permission to Redshift AND THEN connect to Redshift
		// *DONOT divide thease processes.
		function (callback) {
			var lambda_ip_cidr = lambda_ip + '/32';
			var params = {
				ClusterSecurityGroupName: securityGroup,
				CIDRIP: lambda_ip_cidr
			};

			redshift = new aws.Redshift({region: redshift_region});
			redshift.authorizeClusterSecurityGroupIngress(params, function (err, data) {
				if (err) {
					console.log('could not set security group, CIDR:', lambda_ip_cidr);
				} else {
					console.log('success to set the security group, CIDR:', lambda_ip_cidr);

					// connect to redshift
					var conn = new pg.Client(conString);
					conn.connect();
					var copyCmd = "COPY "+table_name+" FROM 's3://"+params.Bucket+"/"+params.Key+"' CREDENTIALS '"+credentials+"' "+options+";";
					conn.query("BEGIN", function(err, result) {
						conn.query(copyCmd, function(err, result) {
							conn.query("COMMIT;", db.end.bind(db));
							console.log('command is executed.');
							if (err) {
								return console.error('error running query', err);
							}
							console.log("redhshift load: no errors, seem to be successful!");
							conn.end();
							callback(null, 'Copy was done.');
						});
					});
				}
			});
		},

		// Revoke IP
		function (callback) {
			if (!redshift) {
				redshift = new aws.Redshift({region: redshift_region});
			}
			var lambda_ip_cidr = lambda_ip + '/32';
			var params = {
				ClusterSecurityGroupName: 'default',
				CIDRIP: lambda_ip_cidr
			};
			redshift.revokeClusterSecurityGroupIngress(params, function (err, data) {
				if (err) {
					console.log('could not unset security group, CIDR:', lambda_ip_cidr);
				} else {
					console.log('success to unset the security group, CIDR:', lambda_ip_cidr);
				}
				callback(null, 'Success revoke.');
			});
		}
	
	], function(err, results) {
		if (err) {
			console.log('error', err);
		}
		console.log(results);
		context.succeed(result);
	});

};
