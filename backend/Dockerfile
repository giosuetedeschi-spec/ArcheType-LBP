# Backend – Java Spring Boot
FROM eclipse-temurin:21-jdk-alpine AS build

# Install global Maven
RUN apk add --no-cache maven

WORKDIR /app

# Copy only the project definition first (better Docker caching)
COPY pom.xml ./

# Download dependencies using global maven
RUN mvn dependency:go-offline -B

# Copy source code and build the application
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]