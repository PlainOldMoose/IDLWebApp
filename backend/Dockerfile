  FROM eclipse-temurin:17-jdk-alpine AS build
  WORKDIR /app
  COPY .mvn/ .mvn
  COPY mvnw pom.xml ./
  RUN ./mvnw dependency:go-offline
  COPY src ./src
  RUN ./mvnw clean package -DskipTests

  FROM eclipse-temurin:17-jre-alpine
  # Not root, so a compromised app has less to work with
  RUN addgroup -S app && adduser -S app -G app
  USER app
  WORKDIR /app
  COPY --from=build /app/target/*.jar app.jar
  EXPOSE 8080
  # CVE-2026-114938 (Java4Shell): turns off the AVX-512 Base64 path it abuses. Drop once Temurin ships the fix and prod runs it
  ENTRYPOINT ["java", "-XX:-UseBASE64Intrinsics", "-jar", "app.jar"]