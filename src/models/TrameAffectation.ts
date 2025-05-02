import { Model, DataTypes } from 'sequelize';
import sequelize from '@/lib/database';

export type PeriodeType = 'HEBDOMADAIRE' | 'BI_HEBDOMADAIRE' | 'MENSUEL';

export interface TrameAffectationAttributes {
    id: string;
    userId: number;
    periodeType: PeriodeType;
    dateDebut: Date;
    dateFin: Date;
    motif: string;
    isRecurrent: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

class TrameAffectation extends Model<TrameAffectationAttributes> implements TrameAffectationAttributes {
    public id!: string;
    public userId!: number;
    public periodeType!: PeriodeType;
    public dateDebut!: Date;
    public dateFin!: Date;
    public motif!: string;
    public isRecurrent!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

TrameAffectation.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
    },
    {
        sequelize,
        modelName: 'TrameAffectation',
        tableName: 'trames_affectation',
        timestamps: true,
    }
);

export default TrameAffectation; 