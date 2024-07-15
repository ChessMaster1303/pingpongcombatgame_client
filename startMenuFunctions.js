function startMenuFunctions() {
    //Tutorial on the Left Side
	line(width * 1.2 / 4, 0, width * 1.2 / 4, height)

	push()
	textFont(justbreathe_font, width * 1 / 30)
	text("Introduction", width * 0.6 / 4, height * 0.4 / 4)
	line(width * 0.2 / 4, height * 0.45 / 4, width * 1 / 4, height * 0.45 / 4)
	textAlign(LEFT)
	textSize(width * 1 / 80)
	text("The year is 2940, humans have evolved past\nguns and now we use ping-pong-like weapons.\nYour job is to eliminate as many hostiles\nas possible! Be brave, respawn tech is available!", width * 0.05 / 4, height * 0.65 / 4)

	fill(255)
	rect(width * 0.5 / 4, height * 1.3 / 4, width * 0.2 / 4, width * 0.2 / 4)
	rect(width * 0.15 / 4, height * 1.95 / 4, width * 0.2 / 4, width * 0.2 / 4)
	rect(width * 0.85 / 4, height * 1.95 / 4, width * 0.2 / 4, width * 0.2 / 4)
	rect(width * 0.5 / 4, height * 2.6 / 4, width * 0.2 / 4, width * 0.2 / 4)

	rect(width * 0.2 / 4, height * 3.3 / 4, width * 0.2 / 4, width * 0.2 / 4)
	rect(width * 0.8 / 4, height * 3.3 / 4, width * 0.2 / 4, width * 0.2 / 4)

	textSize(width * 1 / 30)
	fill(0)
	textAlign(CENTER)
	text("W", width * 0.6 / 4, height * 1.3 / 4 + width * 0.15 / 4)
	text("A", width * 0.25 / 4, height * 1.95 / 4 + width * 0.15 / 4)
	text("S", width * 0.95 / 4, height * 1.95 / 4 + width * 0.15 / 4)
	text("D", width * 0.6 / 4, height * 2.6 / 4 + width * 0.15 / 4)
	text("F", width * 0.3 / 4, height * 3.3 / 4 + width * 0.15 / 4)
	text("B", width * 0.9 / 4, height * 3.3 / 4 + width * 0.15 / 4)

	fill(255)
	textSize(width * 1 / 80)
	text("Toggle\nFight Mode", width * 0.3 / 4, height * 3.8 / 4)
	text("Toggle\nBuild Mode", width * 0.9 / 4, height * 3.8 / 4)
	pop()

	push()
	translate(width * 0.6 / 4, height * 2.1 / 4)
	imageMode(CENTER)
	rotate(atan2(mouseY - height * 2.1 / 4, mouseX - width * 0.6 / 4) - PI / 2)
	image(demoPlayerImage, 0, 0, width * 0.3 / 4, width * 0.3 / 4 * 202 / 146)
	pop()



	//Changelog
    push()
    fill(255)
    stroke(255)
    textSize(width * 1/40)
    text("Version 0.7.0\nChangelog", width * 3.5/4, height * 0.5/4)
    line(width * 3.2/4, height * 0.8/4, width * 3.8/4, height * 0.8/4)
    textAlign(LEFT)
    textSize(width * 1/80)
    text("- Improved Graphics", width * 3.25/4, height * 1/4)
    text("- Added New SFX", width * 3.25/4, height * 1.2/4)
    text("- Improved Death Screen", width * 3.25/4, height * 1.4/4)
    text("- Better Tutorial Instructions", width * 3.25/4, height * 1.6/4)
    text("- Fixed Some Gameplay Bugs", width * 3.25/4, height * 1.8/4)
    pop()
}