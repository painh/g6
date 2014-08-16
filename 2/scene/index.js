var TILE_WIDTH = 60;
var TILE_HEIGHT = 60;

var g_cameraX = 0;
var g_cameraY = 500;

var g_effectManager = new EffectManager();
var g_gameUI = new BtnManager();

var g_objList = new ObjManager(); 
var g_imgs = [];
var g_map_height = 0;
var g_map_width = 0;

var g_coin = 0;
var g_player; 

var PLAYER_MAX_Y = 500 + 390;
var gauge_dec = 30;
var CRAGON_TIME = 15 * 1000; 
//CRAGON_TIME = 1; 

var g_cragonTime = 0; 
var g_cragonLevel = 1; 
var g_mon_level = 1; 
var g_mon_level_time;

var g_score_list = [];
var g_jumpGauge = 100;
var g_jumpGaugeMax = 100;

var g_turrentCnt = 3;
var g_turrentPrice = 15;
var g_merchantMode = false;
var g_merchantTime;

var g_meteoTime;
var g_height = 0;
var g_heightWorld = 0;
var g_heightWorldPrev = 0;

var g_stageTime = 0;
var g_stageTimeLeft = 0;
var g_stageTimeMax = 60;
var g_stageHeight = 3;

var g_score = 0;
var g_stage = 0;

var SceneIngame = function() { 

	this.LoadStage = function(idx) {
		this.state = 'game';
	
		g_objList.Clear();
		console.log('start!');
		Renderer.defaultColor = "#000"; 
	}

	this.LoadImg = function(name, img, width, height) {
		g_imgs[name] = {};
		g_imgs[name].img = ImageManager.Register( "assets/"+img, name);
		g_imgs[name].width = width;
		g_imgs[name].height = height;

		return g_imgs[name];
	}

	this.Start = function() { 
		this.LoadImg('bg', 'bg.png',  320, 500); 
		this.LoadImg('player', 'player.png',  128, 128); 

		this.LoadImg('cragon', 'cragon.png', 320, 291);

		this.LoadImg('mon_1', '01001.png', 128, 128);
		this.LoadImg('mon_2', '01003.png', 128, 128);
		this.LoadImg('mon_3', '01005.png', 128, 128);
		this.LoadImg('mon_4', '01006.png', 128, 128);
		this.LoadImg('mon_5', '01007.png', 128, 128);

		this.LoadImg('sword_effect', 'sword_effect.png', 60, 60);

		this.LoadImg('hp', 'heart.gif', 50, 50);

		this.LoadImg('coin', 'gold.png', 64, 64);


		this.LoadImg('dust', 'dust.png', 208, 208);
		this.LoadImg('meteo', 'meteo.png', 128, 128);
		this.LoadImg('warn', 'ability_08.png', 128, 128); 
		this.LoadImg('redline', 'redline.png', 1, 500); 

		this.LoadImg('merchant', 'merchant.png', 128, 128);
		this.LoadImg('turret', 'turret.png', 60, 60);
		this.LoadImg('turret_fire', 'turret_fire.png', 320, 6);

		g_player = g_objList.Add(Renderer.width / 2 - TILE_WIDTH / 2,
								PLAYER_MAX_Y, "player");
		g_player.default_ay = 0.3;
		g_player.hp = 3;
		g_player.max_ay = 10;

		AddGold(g_player.x, g_player.y - 200);

		this.GenerateMon();
		g_cragonTime = g_now.getTime() + CRAGON_TIME; 
		g_mon_level_time = g_now;

		AddTurret(g_player.x, g_player.y - 200);

//		this.GenerateMerchant(); 
		this.GenerateCragon();

		g_gameUI.Add(20, 400,  100, 30, '나가기', this, 'exit');
		g_gameUI.Add(20, 100,  200, 30, '터렛 구입('+g_turrentPrice+'원)', this, 'buyTurret');

		g_merchantTime = g_now;
		g_meteoTime = g_now;
		g_stageTime = g_now;
		g_height = Math.abs(parseInt((g_player.y - 890) / 160));
		g_heightWorldPrev = PLAYER_MAX_Y + TILE_HEIGHT ;
		console.log(g_height, g_heightWorld);
	}

	this.exit = function() {
		g_merchantMode = false;
	}

	this.buyTurret = function() {
		if( g_coin < g_turrentPrice )
			return;

		g_coin -= g_turrentPrice;
		g_turrentCnt++;
	}

	this.End = function() {
	} 

	this.GenerateMerchant = function() {
		if(g_objList.GetObjByType('cragon').length == 0) {
			var x = randomRange(0 , 4) * TILE_WIDTH;
			var y = g_player.y - randomRange(PLAYER_MAX_Y - 500, PLAYER_MAX_Y - 300);
			var obj = g_objList.Add(x, y, "merchant");

			obj.ay = 0.5;
			obj.max_ay = 10;
			obj.hp = randomRange(1, 2) * g_mon_level / 2;
			g_merchantTime = g_now;
		}
	}

	var g_patterns =[ [	[0, 1, 0, 0, 0],
						[0, 1, 0, 0, 0],
						[0, 1, 0, 0, 0],
						[0, 1, 0, 0, 0],
						[0, 1, 0, 0, 0] ],

					[	[0, 0, 0, 1, 0],
						[0, 0, 0, 1, 0],
						[0, 0, 1, 0, 0],
						[0, 1, 0, 0, 0],
						[0, 1, 0, 0, 0] ],
	
					];

	this.GenerateMeteo = function () { 
		g_meteoTime = g_now;
		var num = randomRange(1, 3);
		for(var i = 0; i < num; ++i) {
			var x = randomRange(50, Renderer.width - 50);
			var y = g_player.y - 1000;
			var obj = g_objList.Add(x, y, "meteo");

			obj.hp = 1;
			var sec = randomRange(10, 30) / 10 * config['fps'];
			obj.visibleDelay = totalFPS + sec; 
			obj.visible = false;
			obj.max_ay = 100;
			obj.ay = 5;
		} 

	}

	this.GenerateMon = function() { 
		var num = randomRange(1, 5);
		this.lastGenTime = new Date(); 

		if(g_objList.GetObjByType('cragon').length > 0)
			return;

		var	min_y = 9999999;

		for(var i in g_objList.m_list) {
			var obj = g_objList.m_list[i];
			min_y = Math.min(obj.y, min_y);
//			console.log(min_y, obj.y);
		}

		if(min_y == 9999999)
			min_y = g_player.y - TILE_HEIGHT * 5;

		if(Math.abs(g_player.y - min_y) > Renderer.height * 2)
			return;

		var p = [];
		
//		if(randomRange(0, 1)  == 1)  {
		if(1) {
			for(var i = 0; i < 5; ++i) {
				p[i] = [];
				for(var j = 0; j < 5; ++j)
					if(randomRange(0, 3) == 0)
						p[i][j] = 1;
					else
						p[i][j] = 0;
			}	
		} 
		else
			p = g_patterns[randomRange(0, g_patterns.length - 1)];

		for(var i = 0; i < 5; ++i) {
			for(var j = 0; j < 5; ++j) {
				var val = p[j][i];
				if(val == 0)
					continue; 

				var x = i * TILE_WIDTH;
				var y = min_y - j * TILE_HEIGHT;
				var mon = Math.min(5, parseInt(g_stage / 2) + 1);
				var obj = g_objList.Add(x, y, "mon_" + mon);

				obj.ay = 0.3;
				obj.max_ay = 10;
				obj.hp = 1; 
			} 
		}

//		for(var i = 0; i < num + g_mon_level; ++i) {
//			var x = randomRange(0 , 4) * TILE_WIDTH;
//			var y = g_player.y - randomRange(PLAYER_MAX_Y - 500, PLAYER_MAX_Y - 300);
//			var obj = g_objList.Add(x, y, "mon_" + g_mon_level);
//
//			obj.ay = randomRange(1, 5) / 10 + g_mon_level / 5;
//			obj.max_ay = 10;
//			obj.hp = randomRange(1, 2) * g_mon_level / 2;
//		} 
//
//		if(g_now - g_mon_level_time > 1000 * 20 * g_mon_level) {
//			g_mon_level = Math.min(5, g_mon_level + 1);
//			g_mon_level_time = g_now;
//		}
//
//
	}

	this.GenerateCragon = function(){
		if(g_objList.GetObjByType('cragon').length > 0)
			return;

		var x = randomRange(0 , 4) * TILE_WIDTH;
		var y = g_player.y - Renderer.height - g_imgs['cragon'].height;
		var obj = g_objList.Add(x, y, "cragon");

		obj.width = g_imgs['cragon'].width;
		obj.height = g_imgs['cragon'].height;

		obj.col_width = g_imgs['cragon'].width;
		obj.col_height = g_imgs['cragon'].height;

		obj.ay = 2;
		obj.max_ay = 10;
		obj.hp = 15 * g_cragonLevel / 2; 
		g_cragonLevel++; 
		g_cragonTime = g_now.getTime() + CRAGON_TIME; 
	}

	this.UpdateGames = function() {
		if(this.state == 'gameOver')
			return;

		if((KeyManager.IsKeyPress(KeyManager.arrowDown) || 
			(MouseManager.Clicked && MouseManager.y > Renderer.height - 30))
			&& g_turrentCnt > 0) {
				AddTurret(g_player.x, g_player.y + TILE_HEIGHT * 2);
				g_turrentCnt--;
		}

		if((MouseManager.Clicked && !(MouseManager.y > Renderer.height - 30)) || KeyManager.IsKeyPress(KeyManager.arrowUp)) { 
			if(g_jumpGauge >= gauge_dec && (KeyManager.IsKeyPress(KeyManager.arrowUp) || MouseManager.y < g_player.y - g_cameraY)) {
				g_player.ay = -10;
				g_jumpGauge -= gauge_dec;
			}
		} 

		if(g_now - this.lastGenTime > 0.5 * 1000) 
			this.GenerateMon();

		if(g_now.getTime() > g_cragonTime)
			this.GenerateCragon();

		if(g_now - g_merchantTime > 30 * 1000)
			this.GenerateMerchant();

		if(g_now - g_meteoTime > 5 * 1000)
			this.GenerateMeteo();

		g_player.ax = 0;
	
		if(KeyManager.IsKeyDown(KeyManager.arrowLeft))
			g_player.ax = -2;

		if(KeyManager.IsKeyDown(KeyManager.arrowRight))
			g_player.ax = 2;

		if(MouseManager.LDown) { 
			if(MouseManager.x < g_player.x + TILE_WIDTH / 2)
				g_player.ax = -2;
			else
				g_player.ax = 2; 
		}

		g_objList.Update(); 

		g_player.x = Math.max(0, g_player.x);
		g_player.x = Math.min(g_player.x, Renderer.width - TILE_WIDTH);
		g_cameraY = g_player.y - 320;
	}
	
	this.Update = function()
	{ 
		g_height = Math.abs(parseInt((g_player.y - 890) / 160));
		g_heightWorld = PLAYER_MAX_Y - g_stageHeight * 160;
		if(KeyManager.IsKeyDown(KeyManager.a))
			g_player.hp = -1;

//		g_stageTimeLeft = g_stageTimeMax - (g_now - g_stageTime) / 1000;
		if(this.state != 'gameOver' && g_player.hp <= 0) {
			this.state = "gameOver";
			var user = prompt("이름을 입력 해 주세요", "AAA");

			var scene = this;
			if(user != null) {
				ajaxReq("r.php", { height : g_height, score : g_score, gold : g_coin, player : user }, function() {
					scene.getScores();
				});
			}
			else
				scene.getScores();
		}

		if(g_player.y < g_heightWorld - TILE_HEIGHT) {
			PLAYER_MAX_Y = g_player.y;
			g_stageTimeMax = g_stageTimeLeft + 10;
			g_stageHeight = g_stageHeight * 2;
			g_heightWorldPrev = g_heightWorld;
			g_stageTime = g_now;
			g_stage++;
			g_player.hp = 3;
			for(var i in g_objList.m_list) {
				var obj = g_objList.m_list[i];
				if(obj.y > g_player.y) {
					g_score += 2;
					obj.Damaged(999);
				} 
			} 
		}

		if(!g_merchantMode) {
			this.UpdateGames();
		} else {
			g_gameUI.Update();
		}

		g_effectManager.Update(); 
	}

	this.getScores = function() {
		ajaxReq("get_scores.php", function(list) {
			g_score_list = list; 
			console.log(list);
		}); 
	}

	this.Render = function()
	{
		Renderer.SetAlpha(1.0); 
		Renderer.SetColor("#000");
		Renderer.Rect(0,0,Renderer.width, Renderer.height);
		
		var bg = g_imgs['bg'];
		Renderer.Img(0,bg.height - g_cameraY, bg.img);

		g_objList.Render(); 
		g_effectManager.Render(); 

		Renderer.SetAlpha(1.0); 
		Renderer.SetFont('8pt Arial'); 

		Renderer.SetColor("#0f0");
		Renderer.SetAlpha(1); 
		Renderer.Rect(0, g_heightWorld - g_cameraY, Renderer.width, 1);
		Renderer.SetColor("#fff");
		Renderer.SetAlpha(1); 
		Renderer.Rect(0, g_heightWorldPrev - g_cameraY , Renderer.width, Renderer.height);


		if(this.state == "gameOver") {
			Renderer.SetAlpha(0.5); 
			Renderer.SetColor("#000");
			Renderer.Rect(0,0,Renderer.width, Renderer.height);
			Renderer.SetFont('15pt Arial'); 
			Renderer.SetColor("#fff");
			Renderer.Text(130,20,"게임 오버!");
			Renderer.Text(40,50,"플레이 해주셔서 감사합니다!");
			Renderer.Text(20,100  , "순위");
			Renderer.Text(80,100  , "점수");
			Renderer.Text(140,100 , "높이");
			Renderer.Text(200,100 , "이름");
			for(var i in g_score_list) {
				var item = g_score_list[i];
				var curLine = 100 + (parseInt(i)+1) * 30;
				Renderer.Text(20, curLine, parseInt(i)+1);
				Renderer.Text(80, curLine, item.score);
				Renderer.Text(140, curLine, item.height);
				Renderer.Text(200, curLine, item.player);
			}
		} else {

			Renderer.SetColor("#000");
			Renderer.SetAlpha(0.5);
			Renderer.Rect(0, Renderer.height - 50, Renderer.width, 50);
			Renderer.SetAlpha(1);
			Renderer.SetColor("#fff");
			var leftHeight = parseInt(Math.abs(g_heightWorld - g_player.y) / 160);
			Renderer.Text(0, 0, "점수 : " + g_score +  " 골드 : " + g_coin + " 높이 " + g_height + "m / 목적지까지 " + leftHeight +"m 미터 남음" );
			var cragon_left = (g_cragonTime) - g_now.getTime();
			cragon_left = parseInt(cragon_left / 1000);
//			Renderer.Text(0, 20, "cragon :  lv."+g_cragonLevel+" "+ cragon_left + " sec left");
			Renderer.SetFont('16pt Arial'); 
			Renderer.SetColor("#f00");
//			Renderer.Text(0, 20, parseInt(g_stageTimeLeft) + " 초 남음");
			Renderer.SetFont('8pt Arial'); 

			if(g_jumpGauge < gauge_dec)
				Renderer.SetColor("#f00");
			else
				Renderer.SetColor("#00f");
			var max = 400;
			var height = g_jumpGauge / g_jumpGaugeMax * max;
			Renderer.Rect(10, 50 + max - height, 20, height);

			for(var i = 0; i < g_player.hp; ++i)
				Renderer.Img(20 + i * (g_imgs['hp'].width + 10), 
						Renderer.height - g_imgs['hp'].height, g_imgs['hp'].img);

			Renderer.SetColor("#fff");
			Renderer.SetFont('15pt Arial'); 
			var img = g_imgs['turret'];
			Renderer.ImgBlt(200, Renderer.height - 30, img.img, 0, 0, img.width, img.height, 30, 30);
			Renderer.Text(230, Renderer.height - 30, "x " + g_turrentCnt);
			Renderer.Text(0, Renderer.height - 30, "터렛 설치");
		}

		if(g_merchantMode) {
			Renderer.SetColor("#000");
			Renderer.SetAlpha(0.5);
			Renderer.Rect(0, 0, Renderer.width, Renderer.height); 
			g_gameUI.Render();
		}
//		g_objList.Render();
//		g_effectManager.Render(); 
//		Renderer.SetAlpha(1.0); 
//		Renderer.SetColor("#ffffff"); 
	} 
};
