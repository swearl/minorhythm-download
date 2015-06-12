$(function(){
	$.ajax({
		url: "json/201105/2401.json",
		dataType: "json",
		success: function(json) {
			$(".title").html(json.title);
			$(".date").html(json.date);
			$(".content").html(json.content);
		}
	});
});