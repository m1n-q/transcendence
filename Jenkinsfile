pipeline {
    agent any
    environment {
        GH_REPO="https://github.com/m1n-q/transcendence.git"
        BRANCH="ws"
        APP_DIR="app"
        IMAGE_NAME="ws"
        SERVICE_NAME="ws"
    }

    stages {
        stage('Pull') {
            steps {
                // Get some code from a GitHub repository
                git url:"${GH_REPO}", branch: "${BRANCH}"
            }
        }
        stage('Build') {
            steps {
                sh "cd ${APP_DIR} && docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} ."
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                    aws ssm get-parameter --name /transcendence/production/${SERVICE_NAME} --query Parameter.Value --output text | jq -r 'to_entries[] | [.key, .value] | join("=")' > .env
                '''
                sh '''
                    docker ps --filter name="${SERVICE_NAME}*" --filter status=running -aq | xargs --no-run-if-empty docker stop

                    docker run -d --name ${SERVICE_NAME}_${BUILD_NUMBER} --net=host \
                    --env-file=".env" \
                    ${IMAGE_NAME}:${BUILD_NUMBER}
                '''
            }
        }
        stage('Clean-up') {
            steps {
                sh '''
                    rm .env
                    docker images --quiet --filter=dangling=true | xargs --no-run-if-empty docker rmi --force
                '''
            }
        }
    }
}
