To deploy

create build folder in main branch, and push it to deployment branch

	git checkout main
	./predeploy.sh -> creates rootDir/
	save it somewhere -> cp -r rootDir ..                                                                              
	git checkout deployment-test
	copy the saved folder -> cp -r ../rootDir/* .
	git add .
	git commit -m "your deployement commit msg"
	git push origin deployement-test (this will trigger netlify hook to deploy) 

