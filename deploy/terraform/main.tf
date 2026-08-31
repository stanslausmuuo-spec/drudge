terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

# VPC Configuration
resource "aws_vpc" "jarvis_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "jarvis-vpc-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_subnet" "jarvis_public_1" {
  vpc_id                  = aws_vpc.jarvis_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "jarvis-public-1"
  }
}

resource "aws_subnet" "jarvis_public_2" {
  vpc_id                  = aws_vpc.jarvis_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "jarvis-public-2"
  }
}

resource "aws_internet_gateway" "jarvis_igw" {
  vpc_id = aws_vpc.jarvis_vpc.id

  tags = {
    Name = "jarvis-igw"
  }
}

resource "aws_route_table" "jarvis_rt" {
  vpc_id = aws_vpc.jarvis_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.jarvis_igw.id
  }

  tags = {
    Name = "jarvis-rt"
  }
}

resource "aws_route_table_association" "rta_1" {
  subnet_id      = aws_subnet.jarvis_public_1.id
  route_table_id = aws_route_table.jarvis_rt.id
}

resource "aws_route_table_association" "rta_2" {
  subnet_id      = aws_subnet.jarvis_public_2.id
  route_table_id = aws_route_table.jarvis_rt.id
}

# ECS Cluster
resource "aws_ecs_cluster" "jarvis_cluster" {
  name = "jarvis-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECR Repositories
resource "aws_ecr_repository" "jarvis_frontend" {
  name                 = "jarvis-frontend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "jarvis_agent" {
  name                 = "jarvis-agent"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
}

output "vpc_id" {
  value = aws_vpc.jarvis_vpc.id
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.jarvis_cluster.name
}

output "frontend_ecr_url" {
  value = aws_ecr_repository.jarvis_frontend.repository_url
}

output "agent_ecr_url" {
  value = aws_ecr_repository.jarvis_agent.repository_url
}
