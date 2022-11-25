pipeline {
    agent any
    environment {
        GH_REPO="https://github.com/m1n-q/transcendence.git"
        BRANCH="notification"
        APP_DIR="app"
        IMAGE_NAME="notification-service"
        SERVICE_NAME="notification-service"
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
                sh "cd ${APP_DIR} && docker build -t ${IMAGE_NAME} ."
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                    aws ssm get-parameter --name /transcendence/production/${SERVICE_NAME} --query Parameter.Value --output text | jq -r 'to_entries[] | [.key, .value] | join("=")' > .env
                '''
                sh '''
                    docker rm -f ${SERVICE_NAME}

                    docker run -d --name ${SERVICE_NAME} --net=host \
                    --env-file=".env" \
                    ${IMAGE_NAME}
                '''
                sh '''
                    rm .env
                '''
            }
        }
    }
}
