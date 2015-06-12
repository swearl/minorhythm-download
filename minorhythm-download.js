var cheerio = require('cheerio'); // npm install cheerio
var iconv   = require('iconv-lite'); // npm install iconv-lite
var async   = require('async'); // npm install async
var http    = require('http');
var fs      = require('fs');

var url_blog = "http://minorhythm.jugem.jp/?eid="
var id_end = 7;
var path_base ="minorhythm";
var path_images = "images";
var path_html = "html";
var path_json = "json";


var save_num = 1;
var entry_ids = [];
var entry_images = [];

function make_dirs(path) {
	var dirs = path.split("/");
	var path_full = path_base;
	for(var i = 0; i < dirs.length; i++) {
		if(dirs[i] != "") {
			path_full += "/" + dirs[i];
			if(!fs.existsSync(path_full)) {
				//console.log(path_full);
				fs.mkdirSync(path_full);
			}
		}
	}
	return path_full + "/";
}

function download_entry(entry_id, callback) {
	console.log("start downloading entry " + entry_id);
	var request = http.get(url_blog + entry_id, function(response){
		if(response.statusCode === 200) {
			var buffers = [];
			var size = 0;
			response.on("data", function(chunk){
				buffers.push(chunk);
				size += chunk.length;
			});
			response.on("end", function(){
				//console.log(size);
				var buf = new Buffer(size);
				var pos = 0;
				for(var i = 0; i < buffers.length; i++) {
					buffers[i].copy(buf, pos);
					pos += buffers[i].length;
				}
				var data = iconv.decode(buf, "EUC-JP");
				$ = cheerio.load(data, {decodeEntities: false});
				$(".service_button, #fb-root, script, style").remove();
				$(".tb_area").remove();
				var entry_body = $(".entry_body .jgm_entry_desc_mark").html().trim();
				var entry_title = $(".entry_title").first().text();
				var entry_date = $(".entry_date").text();
				var new_entry_body = parse_images(entry_body);
				//save_entry(entry_id, entry_title, entry_date, entry_body);
				save_json_entry(entry_id, entry_title, entry_date, new_entry_body);
				callback();
			});
		} else {
			console.log("error entry " + entry_id);
			callback();
		}
	});
}

function download_image(image_link, callback) {
	var image_link_local = change_image_local(image_link);
	images_num_ed++;
	var progress = images_num_ed + "/" + images_num;
	if(!check_image_local(image_link_local)) {
		console.log(progress + " start downloading " + image_link);
		var request = http.get(image_link, function(response){
			if(response.statusCode === 200) {
				var tmp = image_link_local.split("/");
				var file_img = tmp.pop();
				var path_new = make_dirs(tmp.join("/"));
				response.pipe(fs.createWriteStream(path_new + file_img));
				callback();
			} else {
				console.log("download error " + image_link);
				callback();
			}
		});
	} else {
		console.log(progress + " image already downladed");
		callback();
	}
}

function save_json_entry(entry_id, entry_title, entry_date, entry_content) {
	var entry = {};
	entry.title = entry_title;
	entry.date = entry_date;
	entry.content = entry_content;

	var entry_year = entry_date.split(".")[0];
	var entry_month = entry_date.split(".")[1];
	var path_new = make_dirs(path_json + "/" + entry_year + entry_month + "/");
	fs.writeFileSync(path_new + entry_id + ".json", JSON.stringify(entry));
	console.log("entry " + entry_id + " saved");
	return true;
}

function parse_images(entry_content) {
	$ = cheerio.load(entry_content, {decodeEntities: false});
	var images = $("img");
	for(var i = 0; i < images.length; i++) {
		var image_link = $(images[i]).attr("src");
		var image_link_local = change_image_local(image_link);
		$(images[i]).attr("src", image_link_local);
		if(!check_image_local(image_link_local)) {
			entry_images.push(image_link);
		}
	}
	return $.html();
}

function change_image_local(image_link) {
	var urlParseRE = /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/;
	var matches = urlParseRE.exec(image_link);
	var host_img = matches[11];
	var path_img = matches[14];
	var file_img = matches[15];
	if(host_img == "picto0.jugem.jp" || host_img == "imaging.jugem.jp") {
		var tmp = path_img.split("/");
		tmp.shift();
		if(tmp[0] != "emoji") {
			tmp.shift();
			tmp.shift();
			tmp.shift();
		}
		tmp.pop();
		path_img = tmp.join("/");
		var path_img_new = path_images + "/picto0/" + path_img + "/";
	} else {
		var path_img_new = path_images + "/img-cdn/";
	}
	return path_img_new + file_img;
}

function check_image_local(image_link) {
	if(fs.existsSync(path_base + "/" + image_link)) {
		return true;
	}
	return false;
}

for(var i = 0; i < save_num; i++) {
	var entry_id = id_end - i;
	entry_ids.push(entry_id);
}
//console.log(url_entries);
var images_num = 0;
var images_num_ed = 0;
async.series({
	one: function(callback) {
		async.eachSeries(entry_ids, function(entry_id, cb_entry) {
			download_entry(entry_id, cb_entry);
		}, function(err) {
			//console.log(entry_images);
			console.log("entries download complete");
			callback();
		});
	},
	two: function(callback) {
		images_num = entry_images.length;
		async.eachSeries(entry_images, function(image_link, cb_image) {
			download_image(image_link, cb_image);
		}, function(err) {
			//console.log(entry_images);
			console.log("images download complete");
			callback();
		});
	}
});
