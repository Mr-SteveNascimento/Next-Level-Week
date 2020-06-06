import { Request, Response } from 'express';
import knex from '../database/connection';

class PointsController {

    async index(req : Request, res: Response) {
        const {city, uf, items} = req.query;

        const parsedItems = String(items)
            .split(',')
            .map(item => Number(item.trim()));

        const points = await knex('points')
            .join('point_items', 'points.id', '=' ,'point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('points.*');

        return res.json(points);
    }

    async show(req : Request, res: Response) {
        const {id} = req.params;
    
        const point = await knex('points').where('id', id).first();
    
        if(!point){
            return res.status(400).json({ message : "Ponto não foi encontrado!"});
        }
    
        const items = await knex('items')
            .join('point_items', 'items.id', '=' ,'point_items.item_id')
            .where('point_items.point_id', id);
        
            return res.json({
                point : point,
                items : items
            });
    }

    async create(req: Request, res: Response) {

        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = req.body;

        const trx = await knex.transaction();

        const point = {
            image: "https://images.unsplash.com/photo-1580913428023-02c695666d61?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };

        const pointResgistred = await trx('points').insert(point);

        const point_id = pointResgistred[0];

        const pointItemRequest = items.map((item_id: number) => {
            return {
                item_id,
                point_id,
            };
        });

        const registredPointItems = await trx('point_items').insert(pointItemRequest);

        await trx.commit();

        if (registredPointItems) {
            return res.json({ status: "success", message: "Ponto de coleta cadastrado com sucesso,"});
        }else{
            return res.json({ status: "error", message: "Erro ao cadastrar ponto de coleta."});
        }
    }

}

export default PointsController;