import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';
import { CategoryResolver, RestaurantResolver } from './restaurants.resolver';
import { RestaurantService } from './restautants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, CategoryRepository])],
  providers: [RestaurantService, RestaurantResolver, CategoryResolver],
})
export class RestaurantsModule {}
