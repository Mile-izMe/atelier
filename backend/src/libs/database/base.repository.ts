/**
 * The small part of the Prisma 8 model API shared by repositories with a string id.
 * TCreate and TUpdate are explicit inputs, not Partial<TEntity>.
 */
export interface RepositoryModel<TEntity, TCreate, TUpdate> {
  create(data: TCreate): Promise<TEntity>;
  where(filter: { id: string }): {
    first(): Promise<TEntity | null>;
    update(data: TUpdate): Promise<TEntity | null>;
    delete(): Promise<TEntity | null>;
  };
}

export abstract class BaseRepository<TEntity, TCreate, TUpdate> {
  protected constructor(
    protected readonly model: RepositoryModel<TEntity, TCreate, TUpdate>,
  ) {}

  findById(id: string): Promise<TEntity | null> {
    return this.model.where({ id }).first();
  }

  create(data: TCreate): Promise<TEntity> {
    return this.model.create(data);
  }

  updateById(id: string, data: TUpdate): Promise<TEntity | null> {
    return this.model.where({ id }).update(data);
  }

  // Physical deletion; soft deletion must be an explicit domain operation.
  hardDeleteById(id: string): Promise<TEntity | null> {
    return this.model.where({ id }).delete();
  }
}
