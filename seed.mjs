import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helpers to generate fake data
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateCPF = () => {
    let n = '';
    for (let i = 0; i < 11; i++) n += Math.floor(Math.random() * 10);
    return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};
const generateCNPJ = () => {
    let n = '';
    for (let i = 0; i < 14; i++) n += Math.floor(Math.random() * 10);
    return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};
const generatePhone = () => {
    return `(11) 9${randomNumber(1000, 9999)}-${randomNumber(1000, 9999)}`;
};

const firstNames = ["Ana", "Bruno", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gabriel", "Helena", "Igor", "Julia", "Lucas", "Mariana", "Nicolas", "Olivia", "Pedro", "Raquel", "Samuel", "Tatiana", "Vinicius", "Yasmin"];
const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida"];
const companies = ["Tech", "Soluções", "Comércio", "Serviços", "Consultoria", "Empreendimentos", "Logística", "Indústria", "Distribuidora", "Global", "Brasil"];
const companyTypes = ["LTDA", "S.A.", "ME", "EPP"];

const professions = ["Engenheiro", "Médico", "Advogado", "Professor", "Programador", "Designer", "Administrador", "Arquiteto", "Contador"];
const states = ["SP", "RJ", "MG", "RS", "PR", "SC", "BA", "CE", "PE", "RN"];
const cities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Porto Alegre", "Curitiba", "Florianópolis", "Salvador", "Fortaleza", "Recife", "Natal"];

async function main() {
    console.log("Iniciando seed de clientes...");

    for (let i = 0; i < 100; i++) {
        const isPF = i < 50; // 50 PF, 50 PJ

        if (isPF) {
            const firstName = randomElement(firstNames);
            const lastName = randomElement(lastNames);
            const fullName = `${firstName} ${lastName}`;
            
            await prisma.customer.create({
                data: {
                    name: fullName,
                    type: "PF",
                    document: generateCPF(),
                    nomeSocial: Math.random() > 0.8 ? `${firstName} Social` : null,
                    dataNascimento: `19${randomNumber(50, 99)}-0${randomNumber(1, 9)}-1${randomNumber(0, 9)}`,
                    rg: `${randomNumber(10, 99)}.${randomNumber(100, 999)}.${randomNumber(100, 999)}-${randomNumber(0, 9)}`,
                    rgEmissor: "SSP",
                    rgDataExp: `20${randomNumber(10, 30)}-01-01`,
                    nomePai: `Pai ${lastName}`,
                    nomeMae: `Mãe ${lastName}`,
                    nacionalidade: "Brasileiro(a)",
                    naturalidade: randomElement(states),
                    estadoCivil: randomElement(["Solteiro(a)", "Casado(a)", "Divorciado(a)"]),
                    sexo: randomElement(["Masculino", "Feminino"]),
                    profissao: randomElement(professions),
                    inscricaoEstadual: Math.random() > 0.5 ? "Isento" : `${randomNumber(100, 999)}.${randomNumber(100, 999)}.${randomNumber(100, 999)}`,
                    locations: {
                        create: [{
                            street: `Rua Exemplo ${randomNumber(1, 1000)}`,
                            neighborhood: "Centro",
                            city: randomElement(cities),
                            state: randomElement(states),
                            cep: `${randomNumber(10000, 99999)}-000`,
                            numero: `${randomNumber(1, 1000)}`
                        }]
                    },
                    contacts: {
                        create: [
                            { name: "Pessoal", type: "Telefone", value: generatePhone() },
                            { name: "Trabalho", type: "Email", value: `${firstName.toLowerCase()}@exemplo.com` }
                        ]
                    }
                }
            });
        } else {
            const companyName = `${randomElement(lastNames)} ${randomElement(companies)} ${randomElement(companyTypes)}`;
            const fantasia = companyName.split(' ')[0] + " " + companyName.split(' ')[1];
            
            await prisma.customer.create({
                data: {
                    name: companyName,
                    type: "PJ",
                    document: generateCNPJ(),
                    nomeFantasia: fantasia,
                    responsavel: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
                    cpfResponsavel: generateCPF(),
                    dataFundacao: `200${randomNumber(0, 9)}-0${randomNumber(1, 9)}-1${randomNumber(0, 9)}`,
                    inscricaoMunicipal: `${randomNumber(100000, 999999)}`,
                    inscricaoEstadual: `${randomNumber(100, 999)}.${randomNumber(100, 999)}.${randomNumber(100, 999)}`,
                    locations: {
                        create: [{
                            street: `Avenida Empresarial ${randomNumber(1, 1000)}`,
                            neighborhood: "Distrito Industrial",
                            city: randomElement(cities),
                            state: randomElement(states),
                            cep: `${randomNumber(10000, 99999)}-000`,
                            numero: `${randomNumber(1, 1000)}`
                        }]
                    },
                    contacts: {
                        create: [
                            { name: "Recepção", type: "Telefone", value: generatePhone() },
                            { name: "Financeiro", type: "Email", value: `financeiro@${fantasia.replace(/\s+/g, '').toLowerCase()}.com.br` }
                        ]
                    }
                }
            });
        }
    }
    console.log("100 clientes gerados com sucesso!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
