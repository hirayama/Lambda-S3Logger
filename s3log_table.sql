/**
 * s3log_table.sql
 *
 * create table query.
 *
 * @author	Tomohiro Hirayama
 * @date	2015-12-16
 */

CREATE TABLE s3log_table (
	bucket_owner VARCHAR(256),
	bucket VARCHAR(256),
	date TIMESTAMP,
	time_diff VARCHAR(256),
	remote_ip VARCHAR(256),
	requester VARCHAR(256),
	request_id VARCHAR(256),
	operator VARCHAR(256),
	request_key VARCHAR(256),
	request_uri VARCHAR(256),
	http_status VARCHAR(256),
	error_code VARCHAR(256),
	bytes_sent VARCHAR(256),
	object_size VARCHAR(256),
	total_time VARCHAR(256),
	turn_around_time VARCHAR(256),
	referrer VARCHAR(256),
	user_agent VARCHAR(256),
	version_id VARCHAR(256)
)
SORTKEY(date)
;
