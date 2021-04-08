To deploy

create build folder in main branch, and push it to deployment branch

	git checkout main
	./predeploy.sh -> creates rootDir/
	git checkout deployment-test
	cd rootDir/
	git add .
	git commit -m "your deployement commit msg"
	git push origin deployement-test (this will trigger netlify hook to deploy) 

