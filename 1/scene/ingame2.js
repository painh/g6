var TILE_WIDTH  = 50;
var TILE_HEIGHT = 50;
var MON_MAX_LEVEL = 5;
var LEVEL_MAX = 7;

var g_cameraX = 0;
var g_cameraY = 0;

var BLOCK_DISTANCE = 33;


var g_distance = 0;
var g_myTeamMinPos = 11;

var g_effectManager = new EffectManager();
var g_gameUI = new BtnManager();
var g_merchant = new BtnManager();

var g_box = 5;
var g_fever = 0;
var g_feverCnt = 0;
var g_feverMax = 10;
var g_feverTurnMax = 2;
var g_feverLeft = 2;
var g_killMonCnt = 0;
var g_score = 0; 
var g_questStartCnt = 0;
var g_questCompleteCnt = 0;
var g_genMonLevel = 1;
var g_genMonGauge = 1;
var g_genMonGaugeMax = 10;
//-----------------------------------------------------------------------------------------------------
//
//



var OBJECT_TYLE_BLOCK = 1;
var stages = [
{ map : 
[
"xxxxxxx",
"x.....x",
"x.p...x",
"x.....x",
"x.....x",
"x.....x",
"xxxxxxx",
]},
{ map : 
[
"     x     ",
"    x.x    ",
"   x...x   ",
"  x.....x  ",
" x.......x ",
"x.........x",
"x.........x",
" x..p....x ",
"  x.....x  ",
"   x...x   ",
"    x.x    ",
"     x     ",
]},
				];

var g_objList = new ObjManager(); 
var g_imgs = [];
var g_map_height = 0;
var g_map_width = 0;
var g_exp = 0;
var g_player; 
var g_stageIDX = 0;
var g_goldAll = 0;
var g_gold = g_goldAll;
var g_prevMerchantSpawnGoldAll = 10;
var g_turn = 1;

var g_prevDate;;
var g_leftSec = 60;
var g_leftTurnMax = 30;
var g_leftTurn = g_leftTurnMax;
var g_feverMode = false;

var g_goldMax = 10;
var g_questCnt = 0;
var g_questCntMax = 0;
var g_questType = '';

var g_price_ap = 10;
var g_price_hp = 3;
var g_price_maxHP = 100;
var g_price_fever = 10;
var g_price_monGauge = 10;

var g_btnShopIncrAp;
var g_btnShopIncrHP;
var g_btnShopIncrFever;
var g_btnShopExit;
var g_btnShopDescMonGague;
var g_btnShopIncrMaxHP;

function AddMonGauge(val)
{
	g_genMonGauge += val;

	if(g_genMonGauge >= g_genMonGaugeMax)
	{
		g_genMonGauge -= g_genMonGaugeMax;
		g_genMonLevel = Math.min(g_genMonLevel + 1, MON_MAX_LEVEL);
	}

	if(g_genMonGauge < 0)
	{
		var prevMax = Math.max((g_genMonLevel - 1), 1) * 10;
		g_genMonGauge = prevMax + val;
		g_genMonLevel = g_genMonLevel - 1;
		if(g_genMonLevel <= 0)
		{
			g_genMonLevel = 1;
			g_genMonGauge = 0;
		}
	} 

	g_genMonGaugeMax = g_genMonLevel * 10;
}

function AddHP(val)
{
	g_player.hp += val;
	if(val < 0)
		g_player.SetState('damaged');

	if(g_player.hp >= g_player.maxHP)
		g_player.hp = g_player.maxHP;
}

function AddGold(val)
{
	g_gold += val;
	g_goldAll += val; 
}

function AddExp(val)
{
	g_player.exp += val;

	var maxExp = g_player.level * 2;
	if(g_player.exp >= maxExp)
	{
		var prevLevel = g_player.level;
		g_player.level = Math.min(g_player.level + 1, LEVEL_MAX);
		if(prevLevel == g_player.level)
			return;
		
		g_player.exp = 0;
//		g_player.maxHP += 5;
		g_player.hp = g_player.maxHP;
		g_player.ap++;
		//g_objList.AddMerchant();
//		g_objList.RandomGen('up_fever');
//		g_objList.RandomGen('up_ap');
//		g_objList.RandomGen('up_exp');
		g_effectManager.Add(g_player.x - g_cameraX, g_player.y - g_cameraY, '#ffffff', 'level up!');
		$.growl('레벨 상승! 공격력과 방어력이 1씩 증가');
	}
}

function ChangeFever(val)
{
	if(g_feverMode && val > 0)
		return;
	console.log('fever val ' + val);

	g_fever += val;

	$.growl('피버 값 증가! ' + val);
	if(g_fever >= g_feverMax)
	{
		g_fever = g_feverMax;
		g_feverMode = true;
		g_feverCnt++;
		g_feverLeft = g_feverTurnMax;
	}
	
	if(g_fever <= 0)
	{
//		if(g_gold >= g_goldMax)
//			g_ingame.OpenShop();
		g_fever = 0;
		g_feverMode = false;
	} 
}

var SceneIngame = function()
{ 
	this.LoadStage = function(idx)
	{
		var d = new Date();
		var n = d.getTime(); 


		this.turnFlag = false;
		this.state = 'game';
		this.title_cnt = 5; 
		this.title_timer = n;
		this.world_moving = false;
		this.world_moving_prev_x = 0;
		this.world_moving_prev_y = 0;
		this.world_moving_enable = false; 
		this.score = 0;
		this.combo = 0;
	
		g_stageIDX = idx;
		g_objList.Clear();

		var map = stages[g_stageIDX].map;
		g_map_height = map.length;
		g_map_width = map[0].length;
		g_cameraX = -(Renderer.width - (g_map_width * TILE_WIDTH)) / 2;
		g_cameraY = -(Renderer.height - (g_map_height * TILE_HEIGHT)) / 2;
		var objList = [];
		for(var i = 0; i < map.length;++i)
		{
			var line = map[i];

			for(var j = 0; j < line.length; ++j)
			{
				var tile = line.charAt(j);
				var type ='';
				if(tile == 'x') type = 'block';
				if(tile == '.') type = 'dark';
				if(tile == 'h') type = 'heart';
				if(tile == 'p') type = 'player';
				if(tile == '1') type = 'mon';
				if(tile == 'b') type = 'box';
				if(tile == 't') type = 'turn';
				if(tile == 'g') type = 'gold';
				if(tile == 'M') type = 'merchant';

				switch(type)
				{
					case 'player':
					case 'mon':
					case 'box':
					case 'turn':
					case 'gold':
					case 'merchant':
						objList.push([j * TILE_WIDTH , i * TILE_HEIGHT, type]);
						g_objList.Add(j * TILE_WIDTH , i * TILE_HEIGHT, 'dark'); 
						continue;
				}

				if(type == '')
					continue;

				g_objList.Add(j * TILE_WIDTH , i * TILE_HEIGHT, type); 
			} 
		}

		for(var i in objList)
		{
			var obj = g_objList.Add(objList[i][0],objList[i][1],objList[i][2]); 
			if(objList[i][2] == 'player')
			{
				g_player = obj;
				g_player.maxHP = 15;
				g_player.hp = g_player.maxHP;
			}
		}


//		for(var i = 0; i < 3; ++i)
//			g_objList.RandomGen('heart');

		for(var i = 0; i < 3; ++i)
			g_objList.RandomGen('mon');

		for(var i = 0; i < 25; ++i)
			g_objList.RandomGen('gold');


		console.log('start!');
		
	}
	this.LoadImg = function(name, img, width, height)
	{
		g_imgs[name] = {};
		g_imgs[name].img = ImageManager.Register( "assets/"+img, name);
		g_imgs[name].width = width;
		g_imgs[name].height = height;
	}
	this.Start = function()
	{ 
		this.LoadImg('block', 'block.gif',  30, 30);
		this.LoadImg('dark', 'dark.gif',  30, 30);
		this.LoadImg('player', 'player.png',  128, 128);
		this.LoadImg('ddong', 'ddong.gif', 50, 50);
		this.LoadImg('npc', 'npc.png', 240, 240);
		this.LoadImg('merchant', 'merchant.png', 128, 128);

		this.LoadImg('gold_1', 'gem_01.png', 160, 160);
		this.LoadImg('gold_2', 'gem_02.png', 160, 160);
		this.LoadImg('gold_3', 'gem_03.png', 160, 160);
		this.LoadImg('gold_4', 'gem_04.png', 160, 160);
		this.LoadImg('gold_5', 'gem_05.png', 160, 160);
		this.LoadImg('gold_6', 'gem_06.png', 160, 160);

		this.LoadImg('box_1', 'present_02.png', 160, 160);
		this.LoadImg('box_2', 'present_03.png', 160, 160);
		this.LoadImg('box_3', 'present_04.png', 160, 160);
		this.LoadImg('box_4', 'present_05.png', 160, 160);
		this.LoadImg('box_5', 'castle_event_alram_coin_bonus.png', 130, 130);

		this.LoadImg('mon_1', '01001.png', 128, 128);
		this.LoadImg('mon_2', '01003.png', 128, 128);
		this.LoadImg('mon_3', '01005.png', 128, 128);
		this.LoadImg('mon_4', '01006.png', 128, 128);
		this.LoadImg('mon_5', '01007.png', 128, 128);

		this.LoadImg('sword', 'sword.gif', 10, 10);
		this.LoadImg('heart', 'heart.gif', 50, 50);


//		this.state = 'title';

//		if(!CheckTouchable())
		{ 
			var ui_width = 50;
			g_gameUI.Add(ui_width, 50, Renderer.width - 100, ui_width, 'up', this, 'pressUp');
			g_gameUI.Add(Renderer.width - ui_width, ui_width, ui_width, Renderer.height - 100, 'right', this, 'pressRight');
			g_gameUI.Add(ui_width, Renderer.height - ui_width - 50, Renderer.width - 100, ui_width, 'down', this, 'pressDown');
			g_gameUI.Add(0, ui_width, ui_width, Renderer.height - 100, 'left', this, 'pressLeft');
		}

		var ui_y = 150;
		ui_width = 50;
		g_btnShopIncrAp = g_merchant.Add(0, ui_y, 150, ui_width, '공격력 증가', this, 'pressIncrAp');
		ui_y += 60;
		g_btnShopIncrHP = g_merchant.Add(0, ui_y, 150, ui_width, '체력 회복', this, 'pressIncrHp');
		ui_y += 60;
		g_btnShopDescMonGague = g_merchant.Add(0, ui_y, 150, ui_width, '적 레벨업 방해', this, 'pressDescMonGague');
		ui_y += 60;
		g_btnShopIncrMaxHP = g_merchant.Add(0, ui_y, 150, ui_width, '최대 체력', this, 'pressIncrMaxHP');
		ui_y += 60;
		g_btnShopExit = g_merchant.Add(0, ui_y, 150, ui_width, '돌아가기', this, 'pressExit');
		g_prevDate = new Date();
//		AddTouchSwipe(function(dir)
//		{
//			switch(dir)
//			{
//				case 'left':
//					g_ingame.pressLeft();
//					break;
//
//				case 'up':
//					g_ingame.pressUp();
//					break;
//
//				case 'down':
//					g_ingame.pressDown();
//					break;
//
//				case 'right':
//					g_ingame.pressRight();
//					break;
//			}	
//		});
//

		this.LoadStage(g_stageIDX);

		this.AddQuest();
	}

	this.pressUp = function()
	{
		if(g_objList.CheckMoving())
			return;
		if(g_feverMode)
			g_objList.GetAllGold();
		g_objList.Move(0, -1);
		this.turnFlag = true;
	}
	
	this.pressDown = function()
	{
		if(g_objList.CheckMoving())
			return;
		if(g_feverMode)
			g_objList.GetAllGold();
		g_objList.Move(0, 1);
		this.turnFlag = true;
	}
	
	this.pressRight = function()
	{
		if(g_objList.CheckMoving())
			return;
		if(g_feverMode)
			g_objList.GetAllGold();
		g_objList.Move(1, 0);
		this.turnFlag = true;
	}
	
	this.pressLeft = function()
	{
		if(g_objList.CheckMoving())
			return;
		if(g_feverMode)
			g_objList.GetAllGold();
		g_objList.Move(-1, 0);
		this.turnFlag = true;
	} 

	this.pressIncrHp = function()
	{
		if(g_gold < g_price_hp)
			return;

		g_gold -= g_price_hp;

		AddHP(1);

		g_price_hp += 1;

		this.OpenShop();
	}

	this.pressIncrMaxHP = function()
	{
		if(g_gold < g_price_maxHP)
			return;

		g_gold -= g_price_maxHP;

		g_player.maxHP += 5

		g_price_maxHP += 100;

		this.OpenShop();
	}


	this.pressDescMonGague = function()
	{
		if(g_gold < g_price_monGauge)
			return;

		g_gold -= g_price_monGauge;

		AddMonGauge(-5);
		g_price_monGauge += 10;

		this.OpenShop();
	}

	this.pressIncrAp = function()
	{
		if(g_gold < g_price_ap)
			return;

		g_gold -= g_price_ap;
		g_player.ap += 10;
		g_price_ap += 1;
		this.OpenShop();
	}

	this.pressIncrFever = function()
	{
		if(g_gold < g_price_fever)
			return;

		g_gold -= g_price_fever;
		ChangeFever(3);
		g_price_fever += 1;
		this.OpenShop();
	} 

	this.pressExit = function()
	{
		this.CloseShop();
	}

	this.End = function()
	{
	} 
	
	this.Update = function()
	{ 
		if(this.state =='gameOver')
			return;

		if(this.state == 'merchant')
		{
			g_merchant.Update();	
			return;
		}

		if(g_questCntMax > 0)
		{
			if(g_questCnt > g_questCntMax)
				g_questCnt = g_questCntMax; 
		}

		var cur = new Date();
//		if(cur.getTime() - g_prevDate.getTime() > 1000)
//		{
//			g_prevDate = cur;
////			g_leftSec--;
//			if(g_leftSec < 0)
//				this.state = 'gameOver'; 
//		}

		if(KeyManager.IsKeyPress(KEY_UP))
			this.pressUp();

		if(KeyManager.IsKeyPress(KEY_DOWN))
			this.pressDown();

		if(KeyManager.IsKeyPress(KEY_LEFT))
			this.pressLeft();

		if(KeyManager.IsKeyPress(KEY_RIGHT))
			this.pressRight();


//		if(g_turn <= 0)
//			this.state = 'gameOver';


		g_score = (g_player.level * 5 + g_killMonCnt * 10 + g_goldAll) - 5;
		if(g_player.hp <= 0)
		{
			g_score = (g_player.level * 5 + g_killMonCnt * 10 + g_goldAll);
			ajaxReq('r.php', { 'maxHp' : g_player.maxHP,
									'ap' : g_player.ap,
									'hpRegen' : g_player.hpRegen,
									'gold' : g_gold,
									'goldAll' : g_goldAll,
									'exp' : g_player.exp,
									'level' : g_player.level,
									'turn' : g_turn,
									'kill_mon' : g_killMonCnt,
									'score' : g_score,
									'fever' : g_fever,
									'fever_cnt' : g_feverCnt,
									'def' : g_player.def, 
									'quest_start_cnt' : g_questStartCnt, 
									'quest_complete_cnt' : g_questCompleteCnt, 
									}, function()
			{
				
			});
			this.state = 'gameOver';
		}

		if(this.state == 'title')
		{
			var d = new Date();
			var n = d.getTime(); 

			if(n - this.title_timer > 1000)
			{
				this.title_timer = n;
				this.title_cnt--;

				if(this.title_cnt == 0)
					this.state = 'game';
			}

			return;
		}

		g_effectManager.Update(); 
		g_gameUI.Update(); 
		g_objList.Update(); 

		if(g_objList.CheckMoving() == false && this.turnFlag)
		{
			this.turnFlag = false;
			this.DoTurn();
		}


		if(g_objList.GetEnemyCnt() == 0)
		{
//			g_stageIDX++;
//			this.LoadStage(g_stageIDX);
		}

//		if(MouseManager.Clicked)
//		{
//			var x = Math.round(MouseManager.x / TILE_WIDTH ) * TILE_WIDTH;
//			var y = Math.round(MouseManager.y / TILE_HEIGHT) * TILE_HEIGHT;
//
//			var list = g_objList.GetChrByPos(x, y);
//
//			if(list.length == 1 && list[0].type == 'dark' && g_box > 0)
//			{
//				g_box--;
//				var obj = g_objList.Add(x, y, 'box'); 
//			}
//		}

	}

	this.DoTurn = function()
	{
		AddMonGauge(1);

		this.combo = 0;
		g_turn++;
		g_leftTurn--;
//		if(g_leftTurn <= 0)
//		{
//			g_leftTurn = 0;
//			this.state = 'gameOver';
//		}
		g_objList.DoTurn();
//		for(var i = 0; i < 3; ++i)
//			g_objList.RandomGen();

//		g_objList.RandomGen('box'); 
		g_objList.RandomGen('mon');
		g_objList.RandomGen('gold');
		g_objList.RandomGen('gold');
		g_objList.RandomGen('gold');
		if(g_feverMode)
			for(var i = 0; i < 25; ++i)
				g_objList.RandomGen('gold');
		if(g_feverMode)
		{
			g_feverLeft--;
			ChangeFever(- g_feverMax / g_feverTurnMax); 
		}

//		if(g_gold >= g_goldMax && g_feverMode == false)
//		{
//			g_ingame.OpenShop();
//		}

		this.AddQuest();
		this.AddMerchant();

		if(g_questCntMax > 0 && g_questType == 'ddong')
		{
			var list = g_objList.GetObjByType('ddong');
			if( list.length + g_questCnt < g_questCntMax)
				g_objList.RandomGen('ddong');
		}
	}

	this.AddMerchant = function()
	{
		var cnt = g_objList.GetMerchantCnt();
		if(cnt != 0)
			return;

		if(randomRange(0, 10) > 2)
			return;

		g_objList.RandomGen('merchant');
	}

	this.AddQuest = function()
	{
		var cnt = g_objList.GetNPCCnt();
		if(cnt != 0)
			return;

		if(randomRange(0, 10) > 3)
			return;

		g_objList.RandomGen('npc');
		g_questCnt = 0;
		var questType = ['mon', 'ddong'];
		g_questType = questType[randomRange(0, 1)];
		g_questType = 'mon';
		if(g_questType == 'mon') 
		{
			$.growl('몬스터를 사냥하고 npc에게 돌아가 보상을 받으세요!');
			g_questCntMax = 10; 
		}
		else
		{
			$.growl('똥을 수집하고 npc에게 돌아가 보상을 받으세요!');
			g_questCntMax = 3; 
			for(var i = 0; i < g_questCntMax;++i) 
				g_objList.RandomGen('ddong');
		}
		g_questStartCnt++;
	}
	
	this.Render = function()
	{
		Renderer.SetAlpha(1.0); 
		Renderer.SetColor("#ffffff"); 

		Renderer.SetAlpha(1.0); 
		Renderer.SetColor("#ffffff"); 
		g_objList.Render(); 
		Renderer.SetAlpha(1.0); 
		Renderer.SetColor("#ffffff"); 
		g_gameUI.Render(); 
		Renderer.SetAlpha(1.0); 
		Renderer.SetColor("#ffffff"); 

//		Renderer.Text(0, 0, g_cameraX + "," + g_cameraY + "," + this.world_moving);


//		if(this.combo >= 2)
//		Renderer.Text(0, Renderer.height - 20, 'combom : ' + this.combo);
		if(this.state == 'title')
		{
			Renderer.SetAlpha(0.5); 
			Renderer.SetColor("#000000"); 
			Renderer.Rect(0, 0, Renderer.width, Renderer.height);

			Renderer.SetAlpha(1.0); 
			Renderer.SetColor("#ffffff"); 
			Renderer.SetFont('16pt Arial');
			Renderer.Text(100, 200, this.title_cnt + " left"); 
		}

		if(this.state == 'gameOver')
		{
			Renderer.SetAlpha(0.5); 
			Renderer.SetColor("#000000"); 
			Renderer.Rect(0, 0, Renderer.width, Renderer.height);
			Renderer.SetAlpha(1); 

			Renderer.SetColor("#fff"); 
			Renderer.SetFont('16pt Arial');
			var y = 150;
			Renderer.Text(24, 150, "게임 종료!"); 
			y+=25; 
			Renderer.Text(24, y, "얻은 금화 수 " + g_goldAll); 
			y+=25; 
			Renderer.Text(24, y, "처치한 몬스터의 수 " + g_killMonCnt); 
			y+=25; 
			Renderer.Text(24, y, "레벨" + g_player.level); 
			y+=25; 
			Renderer.Text(24, y, "최종 점수" + g_score); 
		} 

		if(this.state == 'merchant')
		{
			Renderer.SetAlpha(0.5); 
			Renderer.SetColor("#000000"); 
			Renderer.Rect(0, 0, Renderer.width, Renderer.height);
			Renderer.SetAlpha(1); 

			Renderer.SetColor("#ffffff"); 
			var y = 90;
			Renderer.Text(20, y, '공격력 : ' + g_player.ap);

			g_merchant.Render();	
		}

		Renderer.SetFont('8pt Arial');


		// fever
//		Renderer.SetColor('#0000ff');
//		Renderer.Rect(0, Renderer.height - 30, Renderer.width, 20);
//		if(g_feverMode)
//			Renderer.SetColor('#ff0000');
//		else
//			Renderer.SetColor('#00ff00');
//		Renderer.Rect(0, Renderer.height - 30, g_fever / g_feverMax * Renderer.width, 20);
//		Renderer.SetColor('#fff'); 
//		if(g_feverMode)
//			Renderer.Text(0, Renderer.height - 30, 'fever mode!: ' +(g_feverLeft)+ ' turn left');
//		else
//			Renderer.Text(0, Renderer.height - 30, 'fever : ' + g_fever + " / " + g_feverMax);
		//
		// exp
		var width = Renderer.width / 2;
		var maxExp = g_player.level * 2;

		if(g_player.level == LEVEL_MAX)
			Renderer.Text(0, 30, "만렙");
		else
		{
			Renderer.SetColor('#0000ff');
			Renderer.Rect(0, 30, width, 20);
			Renderer.SetColor('#00ff00');
			Renderer.Rect(0, 30, g_player.exp / maxExp * width, 20);
			Renderer.SetColor('#fff'); 
			Renderer.Text(0, 30, 'level : ' + g_player.level + " exp : " + g_player.exp + " / " + maxExp);
		}
		//
		// gold
		//Renderer.SetColor('#-0001ff');
		//Renderer.Rect(0, 0, width, 20);
		//Renderer.SetColor('#ffff00');
		//var maxExp = g_player.level * 2;
		//Renderer.Rect(0, 0, g_gold / g_goldMax * width, 20);
		Renderer.SetFont('18pt Arial');
		Renderer.SetColor('#000'); 
		Renderer.Text(0, Renderer.height - 30, 'hp : ' + g_player.hp + ' gold : ' + g_gold  + ' score : ' + g_score);

		var img = g_imgs['mon_' + g_genMonLevel];
		var nextMonLevel = Math.min(g_genMonLevel + 1, MON_MAX_LEVEL);
		var imgNext = g_imgs['mon_' + nextMonLevel];

		Renderer.ImgBlt( 0 , 0, img.img, 0, 0, img.width, img.height,	30, 30); 
		Renderer.ImgBlt( 100 , 0, imgNext.img, 0, 0, imgNext.width, imgNext.height,	30, 30); 

		Renderer.SetColor('#000');
		Renderer.SetFont('10pt Arial');
		Renderer.Text(30, 10, '  ' + g_genMonGauge + ' / ' + g_genMonGaugeMax);

		//quest

		if(g_questCntMax > 0)
		{
			var img = g_imgs['mon_1'];
			if(g_questType == 'ddong')
				img = g_imgs['ddong'];

			Renderer.ImgBlt( width + 20 , 
								30, img.img, 
								0, 0, img.width, img.height,	
								50, 50);


			Renderer.SetColor('#000');
			Renderer.SetFont('16pt Arial');
			Renderer.Text(width + 70, 50, ' x ' + g_questCnt + ' / ' + g_questCntMax);
		}
		
		g_effectManager.Render(); 
		Renderer.SetAlpha(1.0); 
		Renderer.SetColor("#ffffff"); 
	} 

	this.OpenShop = function()
	{ 
		this.state = 'merchant'; 

		var targetBtn = g_btnShopIncrAp;
		if(g_gold >= g_price_ap) targetBtn.captionColor = '#fff';
		else targetBtn.captionColor = '#f00';
		targetBtn.caption			= '공격력 1증가 / '+g_price_ap+' gold';


		var targetBtn = g_btnShopIncrHP;
		if(g_gold >= g_price_hp) targetBtn.captionColor = '#fff';
		else targetBtn.captionColor = '#f00';
		targetBtn.caption		= 'hp 회복 / '+g_price_hp+' gold';

		var targetBtn = g_btnShopDescMonGague;
		if(g_gold >= g_price_monGauge) targetBtn.captionColor = '#fff';
		else targetBtn.captionColor = '#f00';
		targetBtn.caption			= '적 레벨업 방해 -5 / '+g_price_monGauge+' gold';

		var targetBtn = g_btnShopIncrMaxHP, price = g_price_maxHP;
		if(g_gold >= g_price_maxHP) targetBtn.captionColor = '#fff';
		else targetBtn.captionColor = '#f00';
		targetBtn.caption			= 'hp 최대치 증가 5 / '+g_price_maxHP+' gold';

		g_btnShopExit.caption		= '돌아가기';
	}
	this.CloseShop = function()
	{ 
//		g_gold = g_gold - g_goldMax;
//		if(g_gold <= g_goldMax)
//		{
//			this.state = 'game';
//			g_goldMax++;
//		} 
		this.state = 'game'; 
		g_objList.ClearObjectType('merchant');
	}
};
