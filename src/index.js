/**
 * Lambda-S3Logger
 * 
 * Trigger: PUT method on the S3 log bucket
 * Execution: Copy the S3 log file to Redshift via Tunnel-SSH
 * 
 * @see		npm_installer.sh, package.sh
 * @since	2015-12-19
 * @author	Tomohiro Hirayama
 */
console.log('Loading function');

// import
var pg = require('pg');
var async = require('async');
var fs = require('fs');
var tunnel = require('tunnel-ssh');
var freeport = require('freeport');

// tunnel-ssh config
var localHost = 'localhost';
var localPort = null;
var RedshiftPort = '5439';
var RedshiftHost = '{RedshiftHost}';
var ElasticIP = '{SSHHOST}';
var privateKeyPath = '{RSAPath}';
var tunnel_config = {
	username: '{sshUserName}',
	port: 22, 
	host: ElasticIP,
	privateKey: fs.readFileSync(privateKeyPath),
	
	dstHost: RedshiftHost,
	dstPort: RedshiftPort,

	srcHost: localHost,
	srcPort: localPort,
	localHost: localHost,
	localPort: localPort,
	keepAlive: false
};

// Redshift params
var RedshiftUsername = '{RedshiftUsername}';
var RedshiftPass     = '{RedshiftPass}';
var RedshiftDB       = '{RedshiftDB}';
var RedshiftTable    = '{RedshiftTable}';
var conString        = 'pg://'+RedshiftUsername+':'+ReadshiftPass+'@'+RedshiftHost+':'+RedshiftPort+'/'+RedshiftDB;
var forwordCon       = 'pg://'+RedshiftUsername+':'+ReadshiftPass+'@'+localHost+':'+localPort+'/'+RedshiftDB;

// Copy command params
var awsAccessKey       = '{awsAccessKey}';
var awsSecretAccessKey = '{awsSecretAccessKey}';
var LambdaRegion       = 'ap-northeast-1';
var credentials        = 'aws_access_key_id='+awsAccessKey+';aws_secret_access_key='+awsSecretAccessKey;
var options            = "delimiter ' ' REMOVEQUOTES COMPUPDATE OFF MAXERROR 1000 TIMEFORMAT AS '[DD/MON/YYYY:HH24:MI:SS' REGION '"+LambdaRegion+"'";

// main
exports.handler = function(event, context) {

	// Get S3 Object
	var bucket = event.Records[0].s3.bucket.name;
	var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
	var params = {
		Bucket: bucket,
		Key: key
	};

	freeport(function(err, port) {
		if (err) {
			console.log(err);
		}
		// tunnel-ssh config
		localPort = port;
		tunnel_config.srcPort = port;
		tunnel_config.localPort = port;
		forwordCon = 'pg://'+RedshiftUsername+':'+ReadshiftPass+'@'+localHost+':'+localPort+'/'+RedshiftDB;

		// Start PortForwarding
		tunnel(tunnel_config, function(e, sshTunnel) {
			if (e) {
				console.log('TunnelError', e);
			}
			// async processes
			async.series([
				// Connect to Redshift
				function (callback) {
					var db = new pg.Client(forwordCon);
					db.connect();
					var copyCmd = "COPY "+table_name+" FROM 's3://"+params.Bucket+"/"+params.Key+"' CREDENTIALS '"+credentials+"' "+options+";";
					db.query(copyCmd, function(err, result) {
						callback(null, true);
					});
				}
			],
			function(err, results) {
				if (err) {
					console.log('error', err);
				}
				console.log(results);
				context.succeed('Success!');
			});
		});
	});
};
