-- cam flash thingy
-- just change the step to where you want it to go
-- cameraFlash is already setup but if you wanna change how long it lasts just change
-- the 1 to any other number


function onStepHit()
	if curStep == 128 then
		setProperty('camHUD.alpha', 1)
	end
    if curStep == 512 then
        cameraFlash('camGame', 'FFFFFF', 0.5);
    end
    if curStep == 704 then
        cameraFlash('camGame', 'FFFFFF', 0.5);
    end
    if curStep == 992 then
        cameraFlash('camGame', 'FFFFFF', 0.5);
    end
    if curStep == 1216 then
        cameraFlash('camGame', 'FFFFFF', 0.5);
    end
    if curStep == 1472 then
        cameraFlash('camGame', 'FFFFFF', 0.5);
    end
    if curStep == 1856 then
        cameraFlash('camGame', 'FFFFFF', 0.5);
    end
    if curStep == 1984 then
        cameraFlash('camGame', 'FFFFFF', 0.3);
    end
	if curStep == 1200 then
		doTweenAlpha('showbox', 'boxpngcozimlazy', 1, 0.1, 'linear')
	end
	if curStep == 1216 then
		doTweenAlpha('hideboxshit', 'boxpngcozimlazy', -1, 0.1, 'linear')
	end
end