package esprit.tn;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

@SpringBootApplication(
    exclude = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class
    },
    scanBasePackages = {
        "esprit.tn.backpi",
        "esprit.tn.collab",
        "esprit.tn.education",
        "esprit.tn.geo",
        "esprit.tn.rendezvous",
        "esprit.tn.donation",
        "esprit.tn.patientmedecin",
        "tn.esprit.smartwatchservice"
    }
)
@EnableMongoRepositories(basePackages = {
    "esprit.tn.backpi",
    "esprit.tn.collab",
    "esprit.tn.education",
    "esprit.tn.geo",
    "esprit.tn.rendezvous",
    "esprit.tn.donation",
    "esprit.tn.patientmedecin",
    "tn.esprit.smartwatchservice"
})
@EnableScheduling
@EnableAsync
@EnableFeignClients(basePackages = {"esprit.tn.geo.client"})
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
