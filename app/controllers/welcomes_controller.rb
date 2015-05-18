class WelcomesController < ApplicationController
  before_action :set_welcome, only: [:show, :edit, :update, :destroy]

  def index
  end

  require 'open-uri'

  def data
    render json: JSON.parse(open("http://api.ucbcomedy.com/dcm?mode=development").read)
  end

end
