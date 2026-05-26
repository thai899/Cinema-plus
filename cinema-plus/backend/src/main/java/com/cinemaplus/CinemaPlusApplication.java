package com.cinemaplus;

import javax.sql.DataSource;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import jakarta.persistence.EntityManagerFactory;
import java.util.Properties;

@SpringBootApplication(exclude = { SecurityAutoConfiguration.class })
// Ép quét chính xác tọa độ các gói, tránh triệt để lỗi gạch đỏ / lạc gói
@EnableJpaRepositories(basePackages = "com.cinemaplus.repositories")
@EntityScan(basePackages = "com.cinemaplus.entities")
public class CinemaPlusApplication {

    public static void main(String[] args) {
        SpringApplication.run(CinemaPlusApplication.class, args);
        System.out.println("=================================================");
        System.out.println("🚀 CINEMA PLUS BACKEND ĐÃ KHỞI CHẠY THÀNH CÔNG!");
        System.out.println("   Cổng API thực tế: http://localhost:8081");
        System.out.println("   Kết nối SQL Server qua Code: ĐÃ THÔNG SUỐT");
        System.out.println("=================================================");
    }

    // 1. Tự động cấu hình cứng DataSource kết nối SQL Server tại đây
    @Bean
    public DataSource dataSource() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        dataSource.setUrl("jdbc:sqlserver://localhost:1433;databaseName=CinemaPlusDB;encrypt=true;trustServerCertificate=true;");
        dataSource.setUsername("sa");
        dataSource.setPassword("123");
        return dataSource;
    }

    // 2. Tự tạo cấu hình entityManagerFactory thủ công
    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory() {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource());
        em.setPackagesToScan("com.cinemaplus.entities");

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);

        Properties properties = new Properties();
        properties.setProperty("hibernate.hbm2ddl.auto", "update");
        properties.setProperty("hibernate.dialect", "org.hibernate.dialect.SQLServerDialect");
        properties.setProperty("hibernate.show_sql", "true");
        em.setJpaProperties(properties);

        return em;
    }

    // 3. Quản lý transaction cho JPA
    @Bean
    public PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManagerFactory);
        return transactionManager;
    }
}