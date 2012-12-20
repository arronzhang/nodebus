
var mimelib = require("../lib/mime-functions.js");
var should = require("should");

module.exports = {
	decodeBase64: function() {
		var str = "yMvD8c34MTDUwjIwyNW15yCjqLCyufrVwqOpIL7dwLTX1MD7scjRx7XEz/vPoqOsCsD7scjRx9a01f61sb7Wsr+2073xzOzS0b6tzerIq7/Y1sbBy7+o1Pq3xrXEwM+80svVtvvM2KOsv6jU+rfGwb3NyM";
		var res = "人民网10月20日电 （安国章） 据来自利比亚的消息，\n利比亚执政当局部队今天已经完全控制了卡扎菲的老家苏尔特，卡扎菲两腿";
		var ret = mimelib.decodeBase64(str, "GB2312");
		ret.should.be.ok;
		ret.should.be.equal(res);

		//var str = "yMvD8c34MTDUwjIwyNW15yCjqLCyufrVwqOpIL7dwLTX1MD7scjRx7XEz/vPoqOsCsD7scjRx9a01f61sb7Wsr+2073xzOzS0b6tzerIq7/Y1sbBy7+o1Pq3xrXEwM+80svVtvvM2KOsv6jU+rfGwb3N";
		//console.log(mimelib.decodeBase64(str, "GB2312"));
	}
	, decodeQ: function() {
		var str = "Test for chinese\n=E4=BA=BA=E6=B0=91=E7=BD=9110=E6=9C=8820=E6=97=A5=E7=94=B5 =EF=BC=88=E5=AE=89=E5=9B=BD=E7=AB=A0=EF=BC=89 =\n=E6=8D=AE=E6=9D=A5=E8=87=AA=E5=88=A9=E6=AF=94=E4=BA=9A=E7=9A=84=E6=B6=88=E6=81=AF=EF=BC=8C\n=E5=88=A9=E6=AF=94=E4=BA=9A=E6=89=A7=E6=94=BF=E5=BD=93=E5=B1=80=E9=83=A8=E9=98=9F=E4=BB=8A=E5=A4=A9=E5=B7=B2=E7=BB=8F=E5=AE=8C=E5=85=A8=E6=8E=A7=E5=88=B6=E4=BA=86=E5=8D=A1=E6=89=8E=E8=8F=B2=E7=9A=84=E8=80=81=E5=AE=B6=E8=8B=8F=E5=B0=94=E7=89=B9=EF=BC=8C=E5=8D=A1=E6=89=8E=E8=8F=B2=E4=B8=A4=E8=85=BF=E5=8F=97=E4=BC=A4=E5=90=8E=E8=A2=AB=E9=80=AE=E6=8D=95=EF=BC=8C=E5=B7=B2=E8=A2=AB=E9=80=81=E5=BE=80=E5=8C=BB=E9=99=A2=E3=80=82 =\n=E6=8D=AE=E5=88=A9=E6=AF=94=E4=BA=9A=E7=94=B5=E8=A7=86=E5=8F=B0=E6=8A=A5=E9=81=93=EF=BC=8C=E5=88=A9=E6=AF=94=E4=BA=9A=E6=89=A7=E6=94=BF=E5=BD=93=E5=B1=80=E7=9A=84=E9=83=A8=E9=98=9F=E4=BB=8A=E5=A4=A9=E6=B8=85=E6=99=A8=E5=AF=B9=E5=8D=A1 ...";
		var res = "Test for chinese\n人民网10月20日电 （安国章） 据来自利比亚的消息，\n利比亚执政当局部队今天已经完全控制了卡扎菲的老家苏尔特，卡扎菲两腿受伤后被逮捕，已被送往医院。 据利比亚电视台报道，利比亚执政当局的部队今天清晨对卡 ...";
		var ret = mimelib.decodeQuotedPrintable(str, false);
		ret.should.be.ok;
		ret.should.be.equal(res);
	}
};
