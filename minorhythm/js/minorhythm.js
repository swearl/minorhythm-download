var index = {
	data: [],
	page: 1,
	total: 0,
	totalpage: 0,
	npp: 20
};

function init_index() {
	$.ajax({
		url: "json/index.json",
		dataType: "json",
		success: function(json) {
			index.data = json.reverse();
			index.total = index.data.length;
			index.totalpage = Math.ceil(index.total / index.npp);
			index_page(1);
			show_blog($(".menu .nav a").first().attr("href"));
		}
	});
}

function index_page(page) {
	page = parseInt(page);
	if(page < 1) page = 1;
	if(page > index.totalpage) page = index.totalpage;
	index.page = page;
	var start = (page - 1) * index.npp;
	var end = start + index.npp;
	if(end > index.total) {
		end = index.total;
	}
	$(".menu .nav").html("");
	for(var i = start; i < end; i++) {
		$(".menu .nav").append("<li><a href='" + index.data[i].json + "'>[" + index.data[i].date + "] " + index.data[i].title + "</a></li>")
	}
}

function show_blog(path_json) {
	$.ajax({
		url: path_json,
		dataType: "json",
		success: function(json) {
			$(".title").html(json.title);
			$(".date").html(json.date);
			$(".content").html(json.content);
		}
	});
}

$(function(){
	init_index();
	$(document).on("click", ".menu .nav a", function(){
		var path_json = $(this).attr("href");
		show_blog(path_json);
		return false;
	});
	$(document).on("click", "#prev, #next", function(){
		if($(this).attr("id") == "prev") {
			var page = index.page - 1;
		} else {
			var page = index.page + 1;
		}
		index_page(page);
		return false;
	});
});