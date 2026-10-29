function onCreatePost()
makeLuaSprite('flash', '', 0, 0);
makeGraphic('flash',screenWidth,screenHeight,'000000')
addLuaSprite('flash', false);
setObjectCamera('flash', 'other')
setProperty('flash.alpha',1)
setProperty('camHUD.alpha', 0)
end

function onCreate()
addCharacterToList('kasumiALT', 'bf')
precacheImage('characters/kasumiALT')
end

function onSongStart()
	doTweenAlpha('flash','flash',0,17,'linear')
end
