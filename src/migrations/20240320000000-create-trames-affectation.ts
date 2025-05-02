import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
    await queryInterface.createTable('trames_affectation', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        periodeType: {
            type: DataTypes.ENUM('HEBDOMADAIRE', 'BI_HEBDOMADAIRE', 'MENSUEL'),
            allowNull: false,
        },
        dateDebut: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        dateFin: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        motif: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isRecurrent: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    });

    // Ajout d'un index sur userId pour optimiser les recherches
    await queryInterface.addIndex('trames_affectation', ['userId']);
}

export async function down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('trames_affectation');
} 